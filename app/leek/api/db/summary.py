from typing import Literal, Sequence, Mapping, Any, Dict
import time
import logging

from elasticsearch import Elasticsearch
from opensearchpy import OpenSearch

from leek.api.conf import settings
from leek.api.db.properties import get_summary_properties
from leek.api.db.version import detect_search_backend
from leek.api.ext import es

Backend = Literal["elasticsearch", "opensearch"]

logger = logging.getLogger(__name__)


def ensure_summary_index_with_mapping(
        client,
        index="celery_task_summary"
):
    # Use ignore=400 or equivalent to avoid errors if it already exists
    body = {
        "mappings": {
            "properties": get_summary_properties()
        }
    }
    client.indices.create(index=index, body=body, ignore=400)


def ensure_task_summary_transform(
        backend: Backend,
        *,
        transform_id: str = "celery_task_summary",
        source_indices: Sequence[str] = ("celery-tasks-*",),
        dest_index: str = "celery_task_summary",
        timestamp_field: str = "timestamp",  # from your mapping
        interval_minutes: int = 1,
        page_size: int = 1000,
) -> None:
    """
    Ensure a periodic transform / index-transform exists and is running, for both:
      - Elasticsearch 7.10 (native transforms)
      - OpenSearch 2.15+ (Index Transforms plugin)

    Groups by:
      - app_env
      - name_parts.function
      - name_parts.module
      - queue
      - exchange
      - routing_key

    and stores:
      - doc_count
      - last_seen (max(timestamp))
    """

    data_selection_query = {
        "bool": {
            # To prevent -Infinity when running aggs against documents missing the timestamp field
            "filter": [
                {"exists": {"field": timestamp_field}},
                {"term": {"kind": "task"}}
            ]
        }
    }

    if backend == "elasticsearch":
        _ensure_es_transform(
            es.connection,
            transform_id=transform_id,
            source_indices=source_indices,
            dest_index=dest_index,
            timestamp_field=timestamp_field,
            data_selection_query=data_selection_query,
        )
    elif backend == "opensearch":
        os_client = OpenSearch(settings.LEEK_ES_URL)
        _ensure_os_transform(
            os_client,
            transform_id=transform_id,
            source_indices=source_indices,
            dest_index=dest_index,
            timestamp_field=timestamp_field,
            interval_minutes=interval_minutes,
            page_size=page_size,
            data_selection_query=data_selection_query,
        )
        os_client.close()
    else:
        raise ValueError(f"Unsupported backend: {backend}")


# ---------- Elasticsearch 7.10 implementation ----------

def _ensure_es_transform(
        client,
        *,
        transform_id: str,
        source_indices: Sequence[str],
        dest_index: str,
        timestamp_field: str,
        data_selection_query: dict,
) -> None:
    """
    Elasticsearch 7.10 transform (pivot + sync.time).
    """

    body: Mapping[str, Any] = {
        "description": f"Summary transform for {','.join(source_indices)}",
        "source": {
            "index": list(source_indices),
            "query": data_selection_query,
        },
        "dest": {"index": dest_index},
        "pivot": {
            "group_by": {
                "app_env": {
                    "terms": {"field": "app_env"}  # source field
                },
                "function": {
                    "terms": {"field": "name_parts.function"}  # source field
                },
                "module": {
                    "terms": {"field": "name_parts.module"}  # source field
                },
                "queue": {
                    "terms": {"field": "queue"}  # source field
                },
                "exchange": {
                    "terms": {"field": "exchange"}  # source field
                },
                "routing_key": {
                    "terms": {"field": "routing_key"}  # source field
                },
            },
            "aggregations": {
                # last time this bucket was seen/updated
                "last_seen": {"max": {"field": timestamp_field}},
            },
        },
        # continuous transform driven off the timestamp
        "sync": {
            "time": {
                "field": timestamp_field,
                "delay": "60s",
            }
        },
    }

    # Check if transform exists
    try:
        client.transform.get_transform(transform_id=transform_id)
        exists = True
    except Exception:
        exists = False

    if exists:
        # only updatable parts must be passed
        client.transform.update_transform(
            transform_id=transform_id,
            body={
                "sync": body["sync"],
            },
        )
    else:
        client.transform.put_transform(
            transform_id=transform_id, body=body
        )

    _start_es_transform_if_not_running(client, transform_id)


def _start_es_transform_if_not_running(client: Elasticsearch, transform_id: str) -> None:
    """
    Check transform stats, and start only if state != 'started'.
    """
    try:
        stats = client.transform.get_transform_stats(transform_id=transform_id)
        transforms = stats.get("transforms", [])
        state = transforms[0].get("state") if transforms else None
    except Exception:
        # If we can't get stats, best effort: try to start and ignore 409
        state = None

    if state == "started":
        logger.info("Transform already started/scheduled.")
        return  # already running

    try:
        client.transform.start_transform(transform_id=transform_id)
    except Exception:
        logger.info("Transform already started or in an illegal state!")


# ---------- OpenSearch 2.15+ implementation ----------

def _ensure_os_transform(
        client,
        *,
        transform_id: str,
        source_indices: Sequence[str],
        dest_index: str,
        timestamp_field: str,
        interval_minutes: int,
        page_size: int,
        data_selection_query: dict,
) -> None:
    """
    OpenSearch index-transform (Index Management plugin).
    Uses /_plugins/_transform/<id> with a "transform" object in the body.
    """

    # In OpenSearch, the body is wrapped in "transform": {...}
    # and we define groups + aggregations instead of "pivot".
    now_unix_ms = int(time.time() * 1000)

    schedule = {
        "interval": {
            "period": interval_minutes,
            "unit": "Minutes",
            "start_time": now_unix_ms,
        }
    }

    transform_def: Mapping[str, Any] = {
        "description": f"Summary transform for {','.join(source_indices)}",
        "enabled": True,
        "continuous": True,
        "schedule": schedule,
        "source_index": ",".join(source_indices),
        "target_index": dest_index,
        "data_selection_query": data_selection_query,
        "page_size": page_size,
        "groups": [
            {
                "terms": {
                    "source_field": "app_env",
                    "target_field": "app_env",
                }
            },
            {
                "terms": {
                    "source_field": "name_parts.function",
                    "target_field": "function",
                }
            },
            {
                "terms": {
                    "source_field": "name_parts.module",
                    "target_field": "module",
                }
            },
            {
                "terms": {
                    "source_field": "queue",
                    "target_field": "queue",
                }
            },
            {
                "terms": {
                    "source_field": "exchange",
                    "target_field": "exchange",
                }
            },
            {
                "terms": {
                    "source_field": "routing_key",
                    "target_field": "routing_key",
                }
            },
        ],
        "aggregations": {
            "last_seen": {"max": {"field": timestamp_field}},
        },
    }

    body = {"transform": transform_def}

    # Does the transform exist?
    try:
        client.transport.perform_request(
            "GET", f"/_plugins/_transform/{transform_id}"
        )
        exists = True
    except Exception:
        exists = False

    if exists:
        # OpenSearch update API uses PUT with same path + full "transform" object
        client.transport.perform_request(
            "PUT",
            f"/_plugins/_transform/{transform_id}",
            body={
                "transform": {
                    "enabled": True,
                    "continuous": True,
                    "schedule": {
                        "interval": {
                            "period": interval_minutes,
                            "unit": "Minutes",
                            "start_time": now_unix_ms,
                        }
                    },
                    "data_selection_query": {"match_all": {}},
                    "page_size": page_size,
                }
            },
        )
    else:
        client.transport.perform_request(
            "PUT",
            f"/_plugins/_transform/{transform_id}",
            body=body,
        )

    _start_os_transform_if_not_enabled(client, transform_id)


def _start_os_transform_if_not_enabled(client: OpenSearch, transform_id: str) -> None:
    """
    Check the transform definition and only call _start if enabled == False.
    """
    try:
        resp = client.transport.perform_request(
            "GET",
            f"/_plugins/_transform/{transform_id}",
        )
        transform = resp.get("transform", resp)  # depending on OS version
        enabled = transform.get("enabled")
    except Exception:
        enabled = None

    if enabled is True:
        logger.info("Transform already started/scheduled.")
        return  # already scheduled/enabled

    try:
        client.transport.perform_request(
            "POST",
            f"/_plugins/_transform/{transform_id}/_start",
        )
    except Exception:
        logger.info("Transform already started or in an illegal state!")


def safe_delete_transform(
        transform_id: str,
        dest_index: str,
) -> Dict[str, Any]:
    """
    Safely stop & delete a transform, then delete its destination index.

    Steps:
      1. Stop the transform (force, idempotent).
      2. Delete the transform.
      3. Delete the destination index.

    Parameters
    ----------
    transform_id : str
        ID of the transform to stop & delete
    dest_index : str
        Name of the destination summary index to delete
    """

    backend = detect_search_backend()["backend"]

    if backend == "opensearch":
        os_client = OpenSearch(settings.LEEK_ES_URL)

    results: Dict[str, Any] = {
        "backend": backend,
        "transform_id": transform_id,
        "dest_index": dest_index,
        "stop_transform": None,
        "delete_transform": None,
        "delete_index": None,
    }

    # ---------- Stop transform ----------
    try:
        if backend == "elasticsearch":
            # force + wait_for_completion so it doesn't stay running
            resp = es.connection.transform.stop_transform(
                transform_id=transform_id,
                force=True,
                wait_for_completion=True,
                timeout="60s",
            )
        elif backend == "opensearch":
            # OpenSearch uses the _plugins endpoint
            resp = os_client.transport.perform_request(
                "POST",
                f"/_plugins/_transform/{transform_id}/_stop",
                params={"force": "true", "wait_for_completion": "true"},
            )
        else:
            raise ValueError("backend must be 'elasticsearch' or 'opensearch'")

        results["stop_transform"] = {"ok": True, "response": resp}
    except Exception as e:
        # Often it's already stopped or missing; that's usually fine
        results["stop_transform"] = {"ok": False, "error": repr(e)}

    # ---------- Delete transform ----------
    try:
        if backend == "elasticsearch":
            resp = es.connection.transform.delete_transform(
                transform_id=transform_id,
                force=True,  # delete even if something thinks it's running
            )
        elif backend == "opensearch":
            resp = os_client.transport.perform_request(
                "DELETE",
                f"/_plugins/_transform/{transform_id}",
            )
        else:
            raise ValueError("backend must be 'elasticsearch' or 'opensearch'")

        results["delete_transform"] = {"ok": True, "response": resp}
    except Exception as e:
        # 404 / not found is usually safe to ignore
        results["delete_transform"] = {"ok": False, "error": repr(e)}

    # ---------- Delete destination index ----------
    try:
        # indices.delete works the same in ES & OpenSearch
        resp = es.connection.indices.delete(index=dest_index, ignore=[400, 404])
        results["delete_index"] = {"ok": True, "response": resp}
    except Exception as e:
        results["delete_index"] = {"ok": False, "error": repr(e)}

    if backend == "opensearch":
        os_client.close()

    return results


def get_summary_transform(
        transform_id: str
):
    backend = detect_search_backend()["backend"]
    try:
        if backend == "opensearch":
            os_client = OpenSearch(settings.LEEK_ES_URL)
            transform = os_client.transport.perform_request(
                "GET", f"/_plugins/_transform/{transform_id}"
            )["transform"]
            transform_stats = os_client.transport.perform_request(
                "GET", f"/_plugins/_transform/{transform_id}/_explain"
            )[transform_id]["transform_metadata"]
            return {
                "id": transform["transform_id"],
                "status": transform_stats["status"],
                "failure": transform_stats["failure_reason"],
                "enabled": transform["enabled"],
                "enabled_at": transform["enabled_at"],
                "documents_processed": transform_stats["stats"]["documents_processed"],
                "documents_indexed": transform_stats["stats"]["documents_indexed"],
                "last_timestamp": transform_stats["continuous_stats"]["last_timestamp"]
            }
        elif backend == "elasticsearch":
            es_client = es.connection
            transform = es_client.transform.get_transform(transform_id=transform_id)["transforms"][0]
            transform_stats = es_client.transform.get_transform_stats(transform_id=transform_id)["transforms"][0]
            return {
                "id": transform_stats["id"],
                "status": transform_stats["state"],
                "failure": None,
                "enabled": transform_stats["state"] in ["started", "indexing"],
                "enabled_at": transform["create_time"],
                "documents_processed": transform_stats["stats"]["documents_processed"],
                "documents_indexed": transform_stats["stats"]["documents_indexed"],
                "last_timestamp": transform_stats["checkpointing"]["last"]["timestamp_millis"]
            }
        else:
            return None
    except Exception as ex:
        logger.error(f"Failed listing transforms with error: {str(ex)}")
        return None


def start_summary_transform(
        transform_id: str
):
    backend = detect_search_backend()["backend"]
    try:
        if backend == "opensearch":
            os_client = OpenSearch(settings.LEEK_ES_URL)
            os_client.transport.perform_request(
                "POST",
                f"/_plugins/_transform/{transform_id}/_start",
            )
        elif backend == "elasticsearch":
            es_client = es.connection
            es_client.transform.start_transform(transform_id=transform_id)
    except Exception:
        logger.info("Transform already started or in an illegal state!")
