import logging
import time
from typing import Dict, List

from elasticsearch import exceptions as es_exceptions
from elasticsearch.helpers import streaming_bulk, errors as bulk_errors

from flask import g

from leek.api.channels.pipeline import notify
from leek.api.db.store import Task
from leek.api.errors import responses
from leek.api.ext import es

logger = logging.getLogger(__name__)


def build_actions(events: List[Dict]):
    actions = []
    for doc in events:
        action = {
            "_id": doc.pop("id"),
            "_op_type": "update",
            "retry_on_conflict": 10,
            "script": {
                "id": "task-merge" if doc["kind"] == "task" else "worker-merge",
                "params": doc
            },
            "upsert": doc
        }
        actions.append(action)
    return actions


def fanout(items: List[Dict]):
    fanout_start_time = time.time()
    events = []
    for item in items:
        if item["kind"] == "task":
            events.append(Task(id=item["uuid"], **item))
    notify(g.context["app"], g.context["app_env"], events)
    logger.debug(f"--- Fanout in {time.time() - fanout_start_time} ---")


def merge_events(index_alias, events: List[Dict]):
    connection = es.connection
    try:
        # Index
        payload_length = len(events)
        index_start_time = time.time()
        actions = build_actions(events)
        updated, errors = [], []
        success, failed = 0, 0
        for ok, item in streaming_bulk(connection, actions, index=index_alias, _source=True):
            if not ok:
                errors.append(item)
                failed += 1
            else:
                updated.append(item["update"]["get"]["_source"])
                success += 1
        index_spent = time.time() - index_start_time
        logger.debug(f"--- Indexed {payload_length} in {index_spent} seconds, "
                     f"Index latency: {(index_spent / payload_length) * 1000}ms ---")
        # Finalize
        if not failed:
            fanout(updated)
            return {"success": success}, 201
        else:
            return {"success": success, "failed": failed, "errors": errors}, 400
    except es_exceptions.ConnectionError:
        return responses.search_backend_unavailable
    except es_exceptions.RequestError as e:
        logger.error(e.info)
        return f"Request error", 409
    except bulk_errors.BulkIndexError as e:
        ignorable_errors = ["max_bytes_length_exceeded_exception"]
        for error in e.errors:
            try:
                err = error["update"]["error"]["caused_by"]["type"]
                if err in ignorable_errors:
                    logger.warning(f"Payload caused an error {err} and leek did not index it!")
                    return "Processed", 201
            except KeyError:
                pass
        logger.error(e.errors)
        return f"Bulk update error", 409
