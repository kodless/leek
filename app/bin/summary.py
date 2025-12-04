from typing import Sequence, Mapping, Any, List
import time

from opensearchpy import OpenSearch
from elasticsearch import Elasticsearch

from properties import get_summary_properties
from utils import abort, logger, Backend


def ensure_all_summary_indexes_with_mapping(es: Elasticsearch, templates):
    try:
        for template in templates:
            summary_index_name = f"summary-{template}"
            ensure_summary_index_with_mapping(es, index=summary_index_name)
            logger.info(f"Summary index {summary_index_name} created or already exists.")
    except Exception as ex:
        abort(f"Failed to create index transform with error {str(ex)}")


def ensure_summary_index_with_mapping(
        client,
        index="celery_task_summary"
):
    # Use ignore=400 or equivalent to avoid errors if it already exists
    body = {
        "settings": {
            "index": {
                # Better to be the same as Transform run interval
                "refresh_interval": "60s"
            }
        },
        "mappings": {
            "properties": get_summary_properties()
        }
    }
    client.indices.create(index=index, body=body, ignore=400)


def ensure_all_indexes_summary_transform(
        backend: Backend,
        es_client: Elasticsearch,
        leek_es_url: str,
        templates: List[str],
) -> None:
    if backend == "elasticsearch":
        client = es_client
    else:
        client = OpenSearch(leek_es_url)

    for template in templates:
        ensure_index_summary_transform(
            backend=backend,
            client=client,
            transform_id=f"summary-{template}-transform",
            dest_index=f"summary-{template}",
            source_indices=(f"{template}-*",),
            timestamp_field="updated_at",
            interval_minutes=1,
            page_size=1000,
        )
    if backend == "opensearch":
        client.close()


def ensure_index_summary_transform(
        backend: Backend,
        client,
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
            client,
            transform_id=transform_id,
            source_indices=source_indices,
            dest_index=dest_index,
            timestamp_field=timestamp_field,
            data_selection_query=data_selection_query,
        )
    elif backend == "opensearch":
        _ensure_os_transform(
            client,
            transform_id=transform_id,
            source_indices=source_indices,
            dest_index=dest_index,
            timestamp_field=timestamp_field,
            interval_minutes=interval_minutes,
            page_size=page_size,
            data_selection_query=data_selection_query,
        )
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
        logger.info(f"Transform {transform_id} already exists, updating its sync config...")
        client.transform.update_transform(
            transform_id=transform_id,
            body={
                "sync": body["sync"],
            },
        )
    else:
        logger.info(f"Transform {transform_id} missing, creating for the first time...")
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

    # Unlike Elasticsearch, Opensearch does not have native incremental documents selections using `sync` block
    # So the "incremental" trick is to add a rolling range on updated_at to data_selection_query and keep
    # continuous: true + a schedule.
    data_selection_query["bool"]["filter"].append({
        "range": {"updated_at": {"gte": "now-5m"}}
    })

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
        # OpenSearch does not allow updating a transform
        logger.info(f"Transform {transform_id} already exists, skip creation.")
    else:
        logger.info(f"Transform {transform_id} missing, creating for the first time...")
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
