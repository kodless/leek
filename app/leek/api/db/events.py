from elasticsearch import exceptions as es_exceptions
from elasticsearch.helpers import streaming_bulk, errors as bulk_errors
import json

from leek.api.errors import responses
from leek.api.ext import es


def upsert_payload(index_alias, payload, app_env):
    data = []
    connection = es.connection
    try:
        for event in payload:
            event["doc"]["app_env"] = app_env
            data.append({
                "_op_type": "update",
                "_index": index_alias,
                "doc_as_upsert": True,
                **event
            })
        if len(data):
            updated = []
            for ok, item in streaming_bulk(connection, data, index=index_alias, _source=True):
                if ok:
                    updated.append(item["update"]["get"]["_source"])
            return updated, 201
        else:
            return [], 201
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
    except es_exceptions.RequestError as e:
        print(json.dumps(e.error, indent=4))
        return f"Request error", 409
    except bulk_errors.BulkIndexError as e:
        print(json.dumps(e.errors, indent=4))
        return f"Update error", 409
