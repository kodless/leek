from datetime import datetime

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
    "task-sent": "QUEUED",
    "task-received": "RECEIVED",
    "task-started": "STARTED",
    "task-succeeded": "SUCCEEDED",
    "task-failed": "FAILED",
    "task-rejected": "REJECTED",
    "task-revoked": "REVOKED",
    "task-retried": "RETRY",
}

STATES_SUCCESS = frozenset(["SUCCEEDED", "RECOVERED"])
STATES_EXCEPTION = frozenset(["FAILED", "RETRY", "REJECTED", "REVOKED"])
STATES_UNREADY = frozenset(["QUEUED", "RECEIVED", "STARTED"])

TaskEventSchema = Schema(
    {
        # in case of task-sent, task-received
        "type": Or(
            *TASK_EVENT_TYPES
        ),
        "uuid": And(str, len),
        "timestamp": And(float, Use(lambda t: int(t * 1000))),  # Seconds to Milliseconds
        "utcoffset": And(int),
        "pid": And(int),
        "clock": And(int),
        Optional("name"): And(str, len),
        Optional("args"): And(str),
        Optional("kwargs"): And(str),
        # exchange/rq/queue are only available with task-sent events
        Optional("exchange"): And(str),
        Optional("routing_key"): And(str),
        Optional("queue"): And(str),
        # If the task has a parent task caller
        Optional("root_id"): Or(None, And(str, len)),
        Optional("parent_id"): Or(None, And(str, len)),
        # countdown: If the task is scheduled or set to be retried after failure
        Optional("eta"): Or(None,
                            And(str,
                                Use(lambda t: int(datetime.strptime(t, "%Y-%m-%dT%H:%M:%S.%f%z").timestamp() * 1000)))),
        # When the task will expire (REVOKED by workers after this time)
        Optional("expires"): Or(None,
                                And(str,
                                    Use(lambda t: int(
                                        datetime.strptime(t, "%Y-%m-%dT%H:%M:%S.%f%z").timestamp() * 1000)))),
        # Available with all event types.
        # Indicates publisher-client in case of task-sent events and consumer-worker in other events
        Optional("hostname"): And(str, len),
        # Only available with task-succeeded events
        Optional("result"): And(str),
        Optional("runtime"): And(float),
        # Only available with task-received events
        Optional("retries"): And(int),
        # Only available with task-failed, task-retried
        Optional("exception"): And(str),
        Optional("traceback"): And(str),
    }
)
