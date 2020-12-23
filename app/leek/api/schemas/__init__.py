from typing import Tuple

from schema import Schema, SchemaError

from leek.api.schemas.task import TASK_EVENT_TYPES, TASK_STATE_MAPPING, TaskEventSchema
from leek.api.schemas.worker import WORKER_EVENT_TYPES, WORKER_STATE_MAPPING, WorkerEventSchema

HISTORICAL_TS_NAMES = {
    "task-sent": "sent_at",
    "task-received": "received_at",
    "task-started": "started_at",
    "task-succeeded": "succeeded_at",
    "task-failed": "failed_at",
    "task-rejected": "rejected_at",
    "task-revoked": "revoked_at",
    "task-retried": "retried_at",
    "worker-online": "online_at",
    "worker-heartbeat": "last_heartbeat_at",
    "worker-offline": "offline_at",
}

EVENT_TYPE_STATE_MAPPING = {
    **TASK_STATE_MAPPING,
    **WORKER_STATE_MAPPING,
}


def validate_payload(payload):
    # Payload contain many events at once
    if isinstance(payload, list):
        validated_payload = []
        for event in payload:
            validated_payload.append(validate_event(event))
        return validated_payload
    # Payload is just one event
    elif isinstance(payload, dict):
        return [validate_event(payload), ]
    else:
        raise SchemaError("Payload does not have events")


def get_custom_fields(doc_type, ev_type, timestamp):
    return {
        "kind": doc_type,
        "state": EVENT_TYPE_STATE_MAPPING.get(ev_type),
        HISTORICAL_TS_NAMES.get(ev_type): timestamp,
    }


def validate_event(ev):
    doc_type, schema = get_schema(ev.get('type'))
    doc = schema.validate(ev)
    ev_type = ev.pop('type')
    custom = get_custom_fields(doc_type, ev_type, doc.get("timestamp"))
    doc.update(custom)
    # Adapt hostname
    source = "client" if doc.get("state") == "QUEUED" else "worker"
    doc[source] = doc.get("hostname")
    # Adapt state
    return {
        "_id": doc.get("uuid") if doc_type == "task" else doc.get("worker"),
        "doc": doc,
    }


def get_schema(event_type: str) -> Tuple[str, Schema]:
    if event_type in TASK_EVENT_TYPES:
        return "task", TaskEventSchema
    elif event_type in WORKER_EVENT_TYPES:
        return "worker", WorkerEventSchema
    else:
        raise SchemaError(f"{event_type} is not a valid celery event type!")
