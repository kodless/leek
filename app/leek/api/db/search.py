import logging
import time
from elasticsearch import exceptions as es_exceptions
from elasticsearch.helpers import scan

from leek.api.db.store import STATES_UNREADY
from leek.api.errors import responses
from leek.api.ext import es

logger = logging.getLogger(__name__)


def search_index(index_alias, query, params):
    start_time = time.time()
    connection = es.connection
    try:
        d = connection.search(index=index_alias, body=query, **params)
        # print("--- Search %s seconds ---" % (time.time() - start_time))
        return d, 200
    except es_exceptions.ConnectionError as e:
        logger.warning(e.info)
        return responses.cache_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found


def get_task_by_uuid(index_alias, task_uuid):
    connection = es.connection
    return connection.get(index=index_alias, id=task_uuid)


def get_revocable_tasks_by_name(index_alias, app_env, task_name):
    tasks = []
    connection = es.connection
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match": {"app_env": app_env}},
                    {"match": {"name": task_name}},
                    {"terms": {"state": list(STATES_UNREADY)}},
                ]
            }
        }
    }
    resp = scan(
        connection,
        index=index_alias,
        query=body,
        _source=False,
        scroll="1m",
        size=1000
    )
    for _, task in enumerate(resp):
        tasks.append(task["_id"])
    return tasks
