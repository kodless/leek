from typing import Dict, Union, List, Tuple

from elasticsearch import exceptions as es_exceptions
from elasticsearch.helpers import streaming_bulk, errors as bulk_errors
import json

from leek.api.db.store import Task, Worker
from leek.api.errors import responses
from leek.api.ext import es


def build_actions(index_alias: str, events: Dict[str, Union[Task, Worker]]):
    actions = []
    for _, event in events.items():
        _id, doc = event.to_doc()
        print(doc)
        actions.append({
            "_id": _id,
            "_op_type": "update",
            "_index": index_alias,
            "doc": doc,
            "doc_as_upsert": True,
        })
    return actions


def merge_events(index_alias, events: Dict[str, Union[Task, Worker]]):
    connection = es.connection
    try:
        actions = build_actions(index_alias, events)
        if len(actions):
            updated = []
            for ok, item in streaming_bulk(connection, actions, index=index_alias, _source=True):
                if ok:
                    _id = item["update"]["_id"]
                    merged = item["update"]["get"]["_source"]
                    m = Task(id=_id, **merged) if merged["kind"] == "task" else Worker(id=_id, **merged)
                    updated.append(m)
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
