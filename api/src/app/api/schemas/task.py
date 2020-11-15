from schema import Schema, And, Or, Optional, Use

TASK_EVENT_TYPES = (
    "task-sent",
    "task-received",
    "task-started",
    "task-succeeded",
    "task-failed",
    "task-rejected",
    "task-revoked",
    "task-retried",
)

TASK_STATE_MAPPING = {
    "task-sent": "SENT",
    "task-received": "RECEIVED",
    "task-started": "STARTED",
    "task-succeeded": "SUCCEEDED",
    "task-failed": "FAILED",
    "task-rejected": "REJECTED",
    "task-revoked": "REVOKED",
    "task-retried": "RETRY",
}

STATES_SUCCESS = frozenset(["SUCCEEDED"])
STATES_EXCEPTION = frozenset(["FAILED", "RETRY", "REJECTED", "REVOKED"])
STATES_UNREADY = frozenset(["SENT", "RECEIVED", "STARTED"])

TaskEventSchema = Schema(
    {
        # in case of task-sent, task-received
        "type": Or(
            *TASK_EVENT_TYPES
        ),
        "uuid": And(str, len),
        "timestamp": And(float, Use(lambda t: t * 1000)),  # Seconds to Milliseconds
        "utcoffset": And(int),
        "pid": And(int),
        "clock": And(int),
        Optional("name"): And(str, len),
        Optional("args"): And(str),
        Optional("kwargs"): And(str),
        # If the exchange and routing keys are set
        Optional("exchange"): And(str, len),
        Optional("routing_key", default="#"): And(str, len),
        # If the task has a parent task caller
        Optional("root_id"): Or(None, And(str, len)),
        Optional("parent_id"): Or(None, And(str, len)),
        Optional("eta"): Or(None, And(str, len)),  # iso date
        Optional("expires"): Or(None, And(float, len)),
        # In case of task-received
        Optional("hostname"): And(str, len),
        # In case of task-succeeded
        Optional("result"): And(str),
        Optional("runtime"): And(float),
        # In case of task-failed, task-retried
        Optional("retries"): And(int),
        Optional("exception"): And(str),
        Optional("traceback"): And(str),
    }
)
