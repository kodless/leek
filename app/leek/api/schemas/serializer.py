from typing import Tuple, Union, Dict

from schema import Schema, SchemaError

from leek.api.db.store import Task, Worker
from leek.api.schemas.task import TASK_EVENT_TYPES, TASK_STATE_MAPPING, TaskEventSchema
from leek.api.schemas.worker import WORKER_EVENT_TYPES, WORKER_STATE_MAPPING, WorkerEventSchema

HISTORICAL_TS_NAMES = {
    "task-sent": "queued_at",
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


def get_schema(event_type: str) -> Tuple[str, Schema]:
    if event_type in TASK_EVENT_TYPES:
        return "task", TaskEventSchema
    elif event_type in WORKER_EVENT_TYPES:
        return "worker", WorkerEventSchema
    else:
        raise SchemaError(f"{event_type} is not a valid celery event type!")


def get_custom_fields(kind, ev_type, event):
    exact_timestamp = event.get("timestamp")
    timestamp = int(exact_timestamp * 1000)
    return {
        "kind": kind,
        "state": EVENT_TYPE_STATE_MAPPING.get(ev_type),
        "timestamp": timestamp,
        "exact_timestamp": exact_timestamp,
        HISTORICAL_TS_NAMES.get(ev_type): timestamp,
    }


def validate_payload(payload, app_env) -> Dict[str, Union[Task, Worker]]:
    # Payload contain many events at once
    if isinstance(payload, list):
        validated_payload = {}
        for event in payload:
            validated_payload.update(validate_event(event, app_env))
        return validated_payload
    # Payload is just one event
    elif isinstance(payload, dict):
        return validate_event(payload, app_env)
    else:
        raise SchemaError("Payload does not have events")


def validate_event(ev, app_env) -> Dict[str, Union[Task, Worker]]:
    ev_type = ev.get("type")
    kind, schema = get_schema(ev_type)
    event = schema.validate(ev)
    custom = get_custom_fields(kind, ev_type, event)
    event.update(custom)
    event.pop("type")
    event["app_env"] = app_env
    if kind == "task":
        # Adapt hostname
        origin = "client" if event["state"] == "QUEUED" else "worker"
        event[origin] = event.pop("hostname")
        event_obj = Task(id=event["uuid"], **event,)
    else:
        event_obj = Worker(id=event["hostname"],  **event,)
    return {event_obj.id: event_obj}
