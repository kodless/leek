import logging
from pyrabbit2 import Client as AMQPClient
from pyrabbit2.http import HTTPError, NetworkError
from elasticsearch import exceptions as es_exceptions
from kombu import Connection
import urllib3

from leek.api.ext import es
from leek.api.conf import settings
from leek.api.errors import responses
from leek.api.utils import lookup_subscription

logger = logging.getLogger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def get_manager_client(subscription):
    connection = Connection(subscription["broker"])
    driver_type = connection.transport.driver_type

    # Events over redis transport are not durable because celery sends them in fanout mode.
    # Therefore, if we try to get events queue depth, the client will raise 404 error.
    # If you want the events to be persisted, use RabbitMQ instead!
    if driver_type != "amqp":
        # TODO: work on redis manager
        return connection, None

    opt = connection.transport_options.get

    def get(name, default):
        return opt('manager_%s' % name) or getattr(connection, name, None) or default

    userid = get("userid", "guest")
    password = get("password", "guest")

    scheme, host_port = subscription.get("broker_management_url").split("://")
    return connection, AMQPClient(host_port, userid, password, scheme=scheme, verify=False)


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
        return responses.subscription_not_found

    # Prepare connection/producer
    # noinspection PyBroadException
    try:
        connection, client = get_manager_client(subscription)
        if connection.transport.driver_type == "amqp":
            client.is_alive()
    except NetworkError:
        return responses.wrong_access_refused
    except Exception:
        return responses.broker_not_reachable

    result = {
        "queue_name": subscription["queue"],
        "latest_event_timestamp": latest_event_timestamp,
        "messages": {
            "total": -1,
            "unacked": -1
        },
        "consumers_count": -1,
    }

    try:
        if connection.transport.driver_type == "amqp":
            q = client.get_queue(name=subscription["queue"], vhost=connection.virtual_host)
            result.update({
                "messages": {
                    "total": q["messages"],
                    "unacked": q["messages_unacknowledged"]
                },
                "consumers_count": q["consumers"],
            })
        # Events over redis transport are not durable because celery sends them in fanout mode.
        # Therefore, if we try to get events queue depth, the client will raise 404 error.
        # If you want the events to be persisted, use RabbitMQ instead!
        elif connection.transport.driver_type == "redis":
            # TODO: find a way to inspect a redis queue
            pass
    except HTTPError as ex:
        logger.error(ex)
    return result, 200


def get_subscription_queues(app_name, app_env):
    # Retrieve subscription
    found, subscription = lookup_subscription(app_name, app_env)
    if not found:
        return responses.subscription_not_found

    # Prepare connection/producer
    # noinspection PyBroadException
    try:
        connection, client = get_manager_client(subscription)
        client.is_alive()
    except NetworkError:
        return responses.wrong_access_refused
    except Exception:
        return responses.broker_not_reachable

    # Queues statistics is only supported when using RabbitMQ
    if connection.transport.driver_type != "amqp":
        return []

    queues_response = client.get_queues()

    queues = []
    for q in queues_response:
        queue = {
            "name": q["name"],
            "state": q.get("state", "unknown"),
            "memory": q["memory"],
            "consumers": q["consumers"],
            "durable": q["durable"],
            "messages": {
                "ready": q["messages_ready"],
                "unacknowledged": q["messages_unacknowledged"],
                "total": q["messages"]
            },
        }
        if "message_stats" in q:
            queue.update({
                "rates": {
                    "incoming": q["message_stats"]["publish_details"]["rate"],
                    "deliver_get": q["message_stats"]["deliver_get_details"]["rate"],
                    "ack": q["message_stats"]["ack_details"]["rate"],
                }
            })
        else:
            queue.update({
                "rates": {
                    "incoming": None,
                    "deliver_get": None,
                    "ack": None,
                }
            })
        queues.append(queue)

    return queues
