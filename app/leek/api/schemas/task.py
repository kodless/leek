from ciso8601 import parse_datetime

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

TaskEventSchema = Schema(
    {
        # in case of task-sent, task-received
        "type": Or(
            *TASK_EVENT_TYPES
        ),
        "uuid": And(str, len),
        "timestamp": And(float),  # Seconds to Milliseconds
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
                                Use(lambda t: int(parse_datetime(t).timestamp() * 1000)))),
        # When the task will expire (REVOKED by workers after this time)
        Optional("expires"): Or(None,
                                And(str,
                                    Use(lambda t: int(parse_datetime(t).timestamp() * 1000)))),
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
        # Only available with task-revoked events
        Optional("terminated"): And(bool),
        Optional("expired"): And(bool),
        Optional("signum"): Or(None, And(Or(int, str))),
        # Only available with task-rejected events
        Optional("requeue"): And(bool),
    }
)
