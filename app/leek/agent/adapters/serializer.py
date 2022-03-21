from typing import Tuple, Union, Dict, Iterable

from ciso8601 import parse_datetime
from schema import SchemaError

from leek.agent.models.task import Task
from leek.agent.models.worker import Worker
from leek.agent.adapters.task import TASK_EVENT_TYPES, TASK_STATE_MAPPING, CompiledTaskEventSchema
from leek.agent.adapters.worker import WORKER_EVENT_TYPES, WORKER_STATE_MAPPING, CompiledWorkerEventSchema

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


def get_validator(event_type: str) -> Tuple[str, callable]:
    if event_type in TASK_EVENT_TYPES:
        return "task", CompiledTaskEventSchema
    elif event_type in WORKER_EVENT_TYPES:
        return "worker", CompiledWorkerEventSchema
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


def validate_payload(payload: Iterable[Dict], app_env) -> Dict[str, Union[Task, Worker]]:
    # Validate
    validated_payload = []
    for event in payload:
        validated_payload.append(validate_event(event))

    # Add custom attributes
    addition_payload = []
    for kind, event in validated_payload:
        addition_payload.append(add_custom_attributes(kind, event, app_env))

    # Merge
    merged_payload = {}
    for event_id, validated_event in addition_payload:
        if event_id in merged_payload:
            # Upsert
            merged_payload[event_id].merge(validated_event)
        else:
            # Add
            merged_payload[event_id] = validated_event

    return merged_payload


def validate_event(ev) -> Tuple[str, dict]:
    ev_type = ev.get("type")
    kind, validate = get_validator(ev_type)
    event = validate(ev)
    return kind, event


def add_custom_attributes(kind, event, app_env) -> Tuple[str, Union[Task, Worker]]:
    ev_type = event.pop("type")
    custom = get_custom_fields(kind, ev_type, event)
    event.update(custom)
    event["app_env"] = app_env
    if kind == "task":
        # Adapt timestamps
        if event.get("eta", None) is not None:
            event["eta"] = int(parse_datetime(event["eta"]).timestamp() * 1000)
        if event.get("expires", None) is not None:
            event["expires"] = int(parse_datetime(event["expires"]).timestamp() * 1000)
        if event.get("traceback", None) is not None:
            event["traceback"] = event["traceback"][:30000]
        # Adapt hostname
        origin = "client" if event["state"] == "QUEUED" else "worker"
        event[origin] = event.pop("hostname")
        event_obj = Task(id=event["uuid"], **event)
    else:
        event_obj = Worker(id=event["hostname"], **event)
    return event_obj.id, event_obj
