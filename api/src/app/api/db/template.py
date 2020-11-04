from elasticsearch import exceptions as es_exceptions

from ..ext import es
from ..errors import responses
from .properties import properties


def create_index_template(index_alias, lifecycle_policy_name="default", meta=None):
    """
    This is considered as an organization project
    An organization can have multiple applications(templates)
    Each day events will be sent to a new index orgName-appName-2020-08-24
    The newly created index will be assigned the template if index name matches index_patterns
    Each day indexes older than 14 days will be deleted using curator
    :param lifecycle_policy_name: Index Lifecycle Policy Name
    :param meta: application level settings
    :param index_alias: index alias in the form of orgName-appName
    """
    connection = es.connection
    body = {
        "index_patterns": [
            f"{index_alias}*"
        ],
        "template": {
            "settings": {
                "index": {
                    "number_of_shards": "2",
                    "number_of_replicas": "1",
                },
                "index.lifecycle.name": lifecycle_policy_name,
                "index.lifecycle.rollover_alias": index_alias
            },
            "aliases": {
                index_alias: {}
            },
            "mappings": {
                "_source": {
                    "enabled": True
                },
                "_meta": meta,
                "dynamic": False,
                "properties": properties
            },
        }
    }
    try:
        connection.indices.put_index_template(name=index_alias, body=body, create=True)
        # Create first index
        connection.indices.create(f"{index_alias}-primary")
        return meta, 201
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
    except es_exceptions.RequestError:
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
        return responses.cache_backend_unavailable
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
        return responses.cache_backend_unavailable
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
        return responses.cache_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found


def delete_application(index_alias):
    """
    Delete index template (Application) and all related indexes (Application Data)
    :param index_alias: index name AKA application name
    :return:
    """
    connection = es.connection
    try:
        connection.indices.delete_index_template(index_alias)
        connection.indices.delete(f"{index_alias}*")
        return "Done", 200
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
    except es_exceptions.RequestError:
        return responses.application_already_exist


def purge_application(index_alias):
    """
    Purge application data by deleting all indexes and create primary empty index
    :param index_alias:
    :return:
    """
    connection = es.connection
    try:
        connection.indices.delete(f"{index_alias}*")
        connection.indices.create(f"{index_alias}-primary")
        return "Done", 200
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
    except es_exceptions.RequestError:
        return responses.application_already_exist
