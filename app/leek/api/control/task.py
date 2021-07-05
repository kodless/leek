import ast
import logging
import time

from kombu.utils.uuid import uuid
from kombu import Connection
from amqp import AccessRefused

from leek.api.conf import settings
from leek.api.errors import responses
from leek.api.control.utils import get_subscription

logger = logging.getLogger(__name__)


def retry_task(app_name, task_doc):
    # Check if task is routable
    if not task_doc.get("exchange", "tasks") and not task_doc.get("routing_key"):
        return responses.task_not_routable

    # Check if agent is local
    if not settings.LEEK_ENABLE_AGENT:
        return responses.control_operations_not_supported

    # Retrieve subscription
    subscription = get_subscription(f"{app_name}-{task_doc['app_env']}")
    if subscription is None:
        return responses.task_retry_subscription_not_found

    # Prepare connection/producer
    # noinspection PyBroadException
    try:
        connection = Connection(subscription["broker"])
        connection.ensure_connection(max_retries=2)
        producer = connection.Producer()
    except AccessRefused:
        return responses.wrong_access_refused
    except Exception:
        return responses.broker_not_reachable

    # Prepare args
    argsrepr = task_doc.get("args") or "()"
    kwargsrepr = task_doc.get("kwargs") or "{}"
    # noinspection PyBroadException
    try:
        args = ast.literal_eval(argsrepr)
        kwargs = ast.literal_eval(kwargsrepr)
    except Exception:
        return responses.malformed_args_or_kwarg_repr

    # Prepare task ids
    task_id = uuid()
    if not task_doc.get("root_id"):
        root_id = task_id
    else:
        root_id = None

    headers = {
        "lang": "py",
        "task": task_doc["name"],
        "id": task_id,
        "shadow": None,
        "eta": None,
        "expires": None,
        "group": None,
        "group_index": None,
        "retries": 0,
        "timelimit": [None, None],
        "root_id": root_id,
        "parent_id": task_doc.get("parent_id"),
        "argsrepr": argsrepr,
        "kwargsrepr": kwargsrepr,
        "origin": "leek@control",
        "ignore_result": True,
    }
    properties = {
        "correlation_id": task_id,
        "reply_to": '',
    }
    body = (
        args, kwargs, {
            "callbacks": None,
            "errbacks": None,
            "chain": None,
            "chord": None,
        },
    )
    # Queue actual task
    producer.publish(
        body,
        exchange=task_doc["exchange"],
        routing_key=task_doc["routing_key"],
        serializer="json",
        compression=None,
        retry=False,
        delivery_mode=2,  # Persistent
        headers=headers,
        **properties
    )
    # Send task-sent event
    sent_event = {
        "type": "task-sent",
        "uuid": task_id,
        "root_id": root_id,
        "parent_id": task_doc.get("parent_id"),
        "name": task_doc["name"],
        "args": argsrepr,
        "kwargs": kwargsrepr,
        "retries": 0,
        "eta": None,
        "expires": None,
        # --
        "queue": task_doc["queue"],
        "exchange": task_doc["exchange"],
        "routing_key": task_doc["routing_key"],
        # --
        "hostname": "leek@control",
        "utcoffset": time.timezone // 3600,
        "pid": 1,
        "clock": 1,
        "timestamp": time.time(),
    }
    # noinspection PyBroadException
    try:
        producer.publish(
            sent_event,
            routing_key=subscription["routing_key"],
            exchange=subscription["exchange"],
            retry=False,
            serializer="json",
            headers={"hostname": "leek@control"},
            delivery_mode=2,
            expiration=60 * 60 * 24 * 2  # EXPIRES IN 2 DAYS
        )
    except Exception as ex:
        logger.warning(f"Failed to send `task-sent` event for the retried task! with exception: {ex}")
    connection.release()
    return {"task_id": task_id}, 200
