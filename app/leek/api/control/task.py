import ast
import logging
import signal
import time
from typing import Union, List

from kombu.utils.uuid import uuid
from kombu import Connection, Exchange
from amqp import AccessRefused

from leek.api.conf import settings
from leek.api.db.store import STATES_TERMINAL
from leek.api.errors import responses
from leek.api.utils import lookup_subscription

logger = logging.getLogger(__name__)


def get_control_exchange():
    return Exchange(f'{settings.LEEK_CONTROL_EXCHANGE_NAME}.pidbox',
                    type='fanout',
                    durable=False,
                    delivery_mode='transient')


def broadcast_worker_command(command, arguments, producer):
    message = {"method": command,
               "arguments": arguments,
               "destination": None,
               "pattern": None,
               "matcher": None}
    exchange = get_control_exchange()
    producer.publish(
        message, exchange=exchange.name, declare=[exchange],
        headers={
            "clock": 1,
            "expires": 300  # 5 minutes, before an unused remote control command queue is deleted from the broker
        },
        serializer="json",
        retry=True,
    )


def retry_task(app_name, task_doc):
    if task_doc.get("state") not in STATES_TERMINAL:
        return responses.task_retry_state_precondition_failed

    # Check if task is routable
    if not task_doc.get("exchange", "tasks") and not task_doc.get("routing_key"):
        return responses.task_not_routable

    # Check if agent is local
    if not settings.LEEK_ENABLE_AGENT:
        return responses.control_operations_not_supported

    # Retrieve subscription
    found, subscription = lookup_subscription(app_name, task_doc['app_env'])
    if not found:
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
    try:
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
    except Exception as ex:
        logger.error(ex)
        return responses.task_retry_failed
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


def retry_tasks(app_name, app_env, tasks_docs: List[dict], dry_run=True):
    # Check if agent is local
    if not settings.LEEK_ENABLE_AGENT:
        return responses.control_operations_not_supported

    # Retrieve subscription
    found, subscription = lookup_subscription(app_name, app_env)
    if not found:
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

    origin = f"leek@control.bulk-retry.{uuid()}"
    ineligible_tasks_ids = []
    eligible_tasks_ids = []

    tasks = []

    for task_doc in tasks_docs:
        task = task_doc["_source"]
        # Check if task is in terminal state
        if task.get("state") not in STATES_TERMINAL:
            # Task state precondition failed
            ineligible_tasks_ids.append(task["uuid"])

        # Check if task is routable
        elif not task.get("exchange", "tasks") and not task.get("routing_key"):
            # Task not routable
            ineligible_tasks_ids.append(task["uuid"])

        else:
            # Prepare args
            argsrepr = task.get("args") or "()"
            kwargsrepr = task.get("kwargs") or "{}"
            # noinspection PyBroadException
            try:
                args = ast.literal_eval(argsrepr)
                kwargs = ast.literal_eval(kwargsrepr)
            except Exception:
                ineligible_tasks_ids.append(task["uuid"])
                continue

            # Prepare task ids
            task_id = uuid()
            if not task.get("root_id"):
                root_id = task_id
            else:
                root_id = None

            eligible_tasks_ids.append(task["uuid"])

            if dry_run is True:
                continue

            # Prepare task
            tasks.append(dict(
                queue=task["queue"],
                exchange=task["exchange"],
                routing_key=task["routing_key"],
                original_id=task["uuid"],
                headers={
                    "lang": "py",
                    "task": task["name"],
                    "id": task_id,
                    "shadow": None,
                    "eta": None,
                    "expires": None,
                    "group": None,
                    "group_index": None,
                    "retries": 0,
                    "timelimit": [None, None],
                    "root_id": root_id,
                    "parent_id": task.get("parent_id"),
                    "argsrepr": argsrepr,
                    "kwargsrepr": kwargsrepr,
                    "origin": origin,
                    "ignore_result": True,
                },
                properties={
                    "correlation_id": task_id,
                    "reply_to": '',
                },
                body=(
                    args, kwargs, {
                        "callbacks": None,
                        "errbacks": None,
                        "chain": None,
                        "chord": None,
                    },
                ),
            ))

    if dry_run is True:
        return {
                   "eligible_tasks_count": len(eligible_tasks_ids),
                   "ineligible_tasks_count": len(ineligible_tasks_ids),
                   "ineligible_tasks_ids": ineligible_tasks_ids
               }, 200

    succeeded_retries = []
    failed_retries = []
    for task in tasks:
        # Queue actual task
        try:
            producer.publish(
                task["body"],
                exchange=task["exchange"],
                routing_key=task["routing_key"],
                serializer="json",
                compression=None,
                retry=False,
                delivery_mode=2,  # Persistent
                headers=task["headers"],
                **task["properties"]
            )
            succeeded_retries.append(task["original_id"])
        except Exception as ex:
            logger.error(ex)
            failed_retries.append(task["original_id"])
            continue

        # Send task-sent event
        headers = task["headers"]
        sent_event = {
            "type": "task-sent",
            "uuid": headers["id"],
            "root_id": headers["root_id"],
            "parent_id": headers["parent_id"],
            "name": headers["task"],
            "args": headers["argsrepr"],
            "kwargs": headers["kwargsrepr"],
            "retries": 0,
            "eta": None,
            "expires": None,
            # --
            "queue": task["queue"],
            "exchange": task["exchange"],
            "routing_key": task["routing_key"],
            # --
            "hostname": origin,
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
                headers={"hostname": origin},
                delivery_mode=2,
                expiration=60 * 60 * 24 * 2  # EXPIRES IN 2 DAYS
            )
        except Exception as ex:
            logger.warning(f"Failed to send `task-sent` event for the retried task! with exception: {ex}")

    connection.release()
    return {
               "succeeded_retries_count": len(succeeded_retries),
               "failed_retries_count": len(failed_retries),
               "origin": origin
           }, 200


def revoke(app_name, app_env, task_uuid: Union[str, List[str]], args):
    # Check if agent is local
    if not settings.LEEK_ENABLE_AGENT:
        return responses.control_operations_not_supported

    # Retrieve subscription
    found, subscription = lookup_subscription(app_name, app_env)
    if not found:
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

    arguments = {
        "task_id": task_uuid,
        **args,
    }

    # noinspection PyBroadException
    try:
        broadcast_worker_command("revoke", arguments, producer)
    except Exception as ex:
        logger.error(ex)
        return responses.task_revocation_failed
    connection.release()

    revocation_count = len(task_uuid) if isinstance(task_uuid, List) else 1
    return {"acknowledged": True, "revocation_count": revocation_count}, 200
