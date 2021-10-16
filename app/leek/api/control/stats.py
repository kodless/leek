from amqp import AccessRefused
from kombu import Connection

import logging
from amqp.exceptions import NotFound
from elasticsearch import exceptions as es_exceptions

from leek.api.ext import es
from leek.api.conf import settings
from leek.api.errors import responses
from leek.api.utils import lookup_subscription

logger = logging.getLogger(__name__)


def get_fanout_queue_drift(index_alias, app_name, app_env):
    # Check if agent is local
    if not settings.LEEK_ENABLE_AGENT:
        return None, 200

    query = {
        "sort": {"timestamp": "desc"},
        "query": {
            "bool": {
                "must": [
                    {"match": {"app_env": app_env}},
                ]
            }
        }
    }
    connection = es.connection
    try:
        d = connection.search(index=index_alias, body=query, size=1)
        if len(d["hits"]["hits"]):
            latest_event_timestamp = d["hits"]["hits"][0]["_source"]["timestamp"]
        else:
            latest_event_timestamp = None
    except es_exceptions.ConnectionError as e:
        logger.warning(e.info)
        return responses.search_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found

    # Retrieve subscription
    found, subscription = lookup_subscription(app_name, app_env)
    if not found:
        return responses.task_retry_subscription_not_found

    # Prepare connection/producer
    # noinspection PyBroadException
    try:
        connection = Connection(subscription["broker"])
        connection.ensure_connection(max_retries=2)
    except AccessRefused:
        return responses.wrong_access_refused
    except Exception:
        return responses.broker_not_reachable

    try:
        name, messages, consumers = connection.channel().queue_declare(queue=subscription["queue"], passive=True)
        result = {
                   "queue_name": name,
                   "messages_count": messages,
                   "consumers_count": consumers,
                   "latest_event_timestamp": latest_event_timestamp
               }
    except NotFound as ex:
        logger.error(ex)
    else:
        connection.release()
        return result, 200
