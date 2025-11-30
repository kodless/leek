import logging
from datetime import timedelta
import time

from elasticsearch import exceptions as es_exceptions
from elasticsearch import client as es_client

from leek.api.conf import settings
from leek.api.db.summary import ensure_summary_index_with_mapping, ensure_task_summary_transform, \
    safe_delete_transform, get_summary_transform, start_summary_transform
from leek.api.db.version import validate_supported_backend
from leek.api.ext import es
from leek.api.errors import responses
from leek.api.db.properties import get_properties

logger = logging.getLogger(__name__)


def get_im_settings(index_alias, lifecycle_policy_name, search_backend):
    if not settings.LEEK_ES_IM_ENABLE:
        return {}

    if search_backend == "opensearch":
        return {
            "index.plugins.index_state_management.rollover_alias": index_alias
        }
    elif search_backend == "elasticsearch":
        return {
            "index.lifecycle.name": lifecycle_policy_name,
            "index.lifecycle.rollover_alias": index_alias
        }


def prepare_template_body(
        index_alias,
        number_of_shards=1,
        number_of_replicas=0,
        lifecycle_policy_name="default",
        meta=None,
        search_backend=None,
):
    return {
        "index_patterns": [
            f"{index_alias}*"
        ],
        "template": {
            "settings": {
                "index": {
                    "number_of_shards": number_of_shards,
                    "number_of_replicas": number_of_replicas,
                    "refresh_interval": settings.LEEK_ES_DEFAULT_REFRESH_INTERVAL
                },
                **get_im_settings(index_alias, lifecycle_policy_name, search_backend),
            },
            "mappings": {
                "_source": {
                    "enabled": True
                },
                "_meta": meta,
                "dynamic": False,
                "properties": get_properties(search_backend)
            },
        }
    }


def create_index_template(
        index_alias,
        number_of_shards=1,
        number_of_replicas=0,
        lifecycle_policy_name="default",
        meta=None
):
    """
    This is considered as an organization project
    An organization can have multiple applications(templates)
    Each day events will be sent to a new index orgName-appName-2020-08-24
    The newly created index will be assigned the template if index name matches index_patterns
    Each day indexes older than 14 days will be deleted using curator
    :param number_of_shards: number of shards
    :param number_of_replicas: number of replicas
    :param lifecycle_policy_name: Index Lifecycle Policy Name
    :param meta: application level settings
    :param index_alias: index alias in the form of orgName-appName
    """
    connection = es.connection
    info = validate_supported_backend()
    body = prepare_template_body(
        index_alias,
        number_of_shards=number_of_shards,
        number_of_replicas=number_of_replicas,
        lifecycle_policy_name=lifecycle_policy_name,
        meta=meta,
        search_backend=info["backend"],
    )
    try:
        connection.indices.put_index_template(name=index_alias, body=body, create=True)
        # Bootstrap first index
        connection.indices.create(f"{index_alias}-000001", body={
            "aliases": {
                index_alias: {
                    "is_write_index": True
                }
            }
        })
        # Create summary index
        ensure_summary_index_with_mapping(connection, index=f"summary-{index_alias}")
        ensure_task_summary_transform(
            backend=info["backend"],
            transform_id=f"summary-{index_alias}",
            dest_index=f"summary-{index_alias}",
            source_indices=(f"{index_alias}-*",),
            timestamp_field="updated_at",
            interval_minutes=1,
            page_size=1000,
        )
        return meta, 201
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.RequestError as e:
        logger.error(e.info)
        return responses.application_already_exist


def get_index_templates(template_prefix):
    connection = es.connection
    try:
        templates = connection.indices.get_index_template(name=f"{template_prefix}*")
        applications = []
        for template in templates["index_templates"]:
            applications.append(template["index_template"]["template"]["mappings"]["_meta"])
        return applications, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return [], 200


def get_template(index_alias):
    return es.connection.indices.get_index_template(name=index_alias)["index_templates"][0]["index_template"]


def get_app(index_alias):
    return get_template(index_alias)["template"]["mappings"]["_meta"]


def add_or_update_app_fo_trigger(index_alias, trigger):
    """
    Update application metadata stored in index template
    :param index_alias: index alias in the form of orgName-appName
    :param trigger: application fanout trigger
    """
    try:
        template = get_template(index_alias)
        app = template["template"]["mappings"]["_meta"]
        triggers = app["fo_triggers"]
        trigger_index = next((i for i, item in enumerate(triggers) if item["id"] == trigger["id"]), None)

        # Create or Update trigger
        if trigger_index is None:
            triggers.append(trigger)
        else:
            triggers[trigger_index] = trigger

        es.connection.indices.put_index_template(name=index_alias, body=template)
        return app, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found


def delete_app_fo_trigger(index_alias, trigger_id):
    """
    Delete a specific fanout trigger by id
    :param index_alias: index alias in the form of orgName-appName
    :param trigger_id: application fanout trigger id
    """
    try:
        template = get_template(index_alias)
        app = template["template"]["mappings"]["_meta"]
        triggers = app["fo_triggers"]
        trigger_index = next((i for i, item in enumerate(triggers) if item["id"] == trigger_id), None)

        # Create or Update trigger
        if isinstance(trigger_index, int):
            del triggers[trigger_index]

        es.connection.indices.put_index_template(name=index_alias, body=template)
        return app, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found


def delete_application(index_alias):
    """
    Delete index template (Application) and all related indexes (Application Data)
    :param index_alias: application indices prefix AKA Application name
    :return:
    """
    connection = es.connection
    try:
        connection.indices.delete_index_template(index_alias)
        connection.indices.delete(f"{index_alias}*")
        safe_delete_transform(
            transform_id=f"summary-{index_alias}",
            dest_index=f"summary-{index_alias}",
        )
        connection.indices.delete(f"summary-{index_alias}")
        return "Done", 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.RequestError:
        return responses.application_already_exist


def purge_application(index_alias):
    """
    Purge application data by deleting all indexes and create primary empty index
    :param index_alias: application indices prefix AKA Application name
    :return:
    """
    connection = es.connection
    try:
        connection.indices.delete(f"{index_alias}*")
        connection.indices.create(f"{index_alias}-000001", body={
            "aliases": {
                index_alias: {
                    "is_write_index": True
                }
            }
        })
        return "Done", 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.RequestError:
        return responses.application_already_exist


def clean_documents_older_than(index_alias, kind="task", count=30, unit="seconds"):
    connection = es.connection
    try:
        now = time.time()
        old = timedelta(**{unit: int(count)}).total_seconds()
        lte = int((now - old) * 1000)
        query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "timestamp": {
                                    "lte": lte
                                }
                            }
                        },
                        {"match": {"kind": kind}}
                    ]
                },
            }
        }
        d = connection.delete_by_query(index=index_alias, body=query,
                                       params=dict(wait_for_completion="false", refresh="true", conflicts="proceed"))
        return d, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found


def get_application_indices(index_alias):
    """
    Get application indices
    :param index_alias: index_alias: application indices prefix AKA Application name
    :return:
    """
    connection = es.connection
    try:
        return connection.indices.stats(f"{index_alias}*"), 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.RequestError:
        return responses.application_already_exist


def get_application_cleanup_tasks(index_alias):
    """
    List application cleanup tasks
    :param index_alias: index_alias: application indices prefix AKA Application name
    :return:
    """
    connection = es.connection
    try:
        tasks_client = es_client.tasks.TasksClient(connection)
        tasks = tasks_client.list(group_by="none", actions="*/delete/byquery", detailed=True)["tasks"]
        tasks = [task for task in tasks if task["description"] == f"delete-by-query [{index_alias}]"]
        return tasks, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.RequestError:
        return responses.application_already_exist


def get_application_transforms(index_alias):
    """
    List application transforms
    :param index_alias: application indices prefix AKA Application name
    :return:
    """
    try:
        summary_transform = get_summary_transform(f"summary-{index_alias}")
        if summary_transform:
            return [summary_transform], 200
        else:
            return [], 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable


def start_application_transform(transform_id):
    """
    Start application transform
    :param transform_id: transform id
    :return:
    """
    try:
        start_summary_transform(transform_id)
        return "Done", 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable


def uniq_admins(list_dicts):
    uniq_list_of_dicts = {}
    for item in list_dicts:
        if item["email"] in uniq_list_of_dicts.keys():
            continue
        else:
            uniq_list_of_dicts.update({item["email"]: item})
    return list(uniq_list_of_dicts.values())


def grant_application_admin(index_alias, admin_email):
    """
    Grant a user application admin role
    :param admin_email: the email address of the new admin
    :param index_alias: index_alias: application indices prefix AKA Application name
    :return: new application definition
    """
    try:
        template = get_template(index_alias)
        app = template["template"]["mappings"]["_meta"]
        admins = app.get("admins", [])
        admins.append({"email": admin_email, "since": int(time.time()) * 1000})
        template["template"]["mappings"]["_meta"]["admins"] = uniq_admins(admins)
        es.connection.indices.put_index_template(name=index_alias, body=template)
        return app, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found


def revoke_application_admin(index_alias, admin_email):
    """
    Revoke a user application admin role
    :param admin_email: the email address of the existing admin
    :param index_alias: index_alias: application indices prefix AKA Application name
    :return: new application definition
    """
    try:
        template = get_template(index_alias)
        app = template["template"]["mappings"]["_meta"]
        admins = app.get("admins", [])
        admins = filter(lambda admin: admin["email"] != admin_email, admins)
        template["template"]["mappings"]["_meta"]["admins"] = list(admins)
        es.connection.indices.put_index_template(name=index_alias, body=template)
        return app, 200
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found
