from typing import Dict, Union

from elasticsearch import exceptions as es_exceptions
from elasticsearch.helpers import streaming_bulk, errors as bulk_errors
import json

from leek.api.db.store import Task, Worker
from leek.api.errors import responses
from leek.api.ext import es


class RetrieveIndexedError(Exception):
    pass


def retrieve_indexed(index_alias, new_events: Dict[str, Union[Task, Worker]]):
    connection = es.connection
    # Retrieving existing events
    ids = []
    for _id in new_events.keys():
        ids.append(_id)
    # Impossible
    if len(ids) != len(set(ids)):
        raise RetrieveIndexedError("Found events with the same id in the payload")
    return connection.mget(
        body={'ids': ids},
        index=index_alias
    )["docs"]


def upsert_concurrently(index_alias, new_events: Dict[str, Union[Task, Worker]]):
    indexed_events = retrieve_indexed(index_alias, new_events)
    # Precedence check
    updated = {}
    for event in indexed_events:
        # If the task is already indexed, update it
        _id = event["_id"]
        new_doc = new_events[_id]
        try:
            found = event["found"]
        except KeyError:
            raise RetrieveIndexedError("Index not found")
        if found:
            source = event["_source"]
            if source["kind"] == "task":
                task = Task(id=_id, **source, )
                task.merge(new_doc)
                updated[_id] = task
            elif source["kind"] == "worker":
                worker = Worker(id=_id, **source, )
                worker.merge(new_doc)
                updated[_id] = worker
        else:
            updated[_id] = new_doc
    return updated


def build_actions(index_alias: str, events: Dict[str, Union[Task, Worker]]):
    actions = []
    for _, event in events.items():
        _id, doc = event.to_doc()
        actions.append({
            "_id": _id,
            "_op_type": "index",
            "_index": index_alias,
            "_source": doc,
        })
    return actions


def merge_events(index_alias, events: Dict[str, Union[Task, Worker]]):
    connection = es.connection
    try:
        safe_events = upsert_concurrently(index_alias, events)
        actions = build_actions(index_alias, safe_events)
        if len(actions):
            updated = []
            for ok, item in streaming_bulk(connection, actions, index=index_alias, _source=True):
                if ok:
                    _id = item["index"]["_id"]
                    updated.append(safe_events[_id])
            return updated, 201
        else:
            return [], 201
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
    except es_exceptions.RequestError as e:
        print(json.dumps(e.info, indent=4))
        return f"Request error", 409
    except bulk_errors.BulkIndexError as e:
        print(json.dumps(e.errors, indent=4))
        return f"Update error", 409
    except RetrieveIndexedError as e:
        return responses.application_not_found
