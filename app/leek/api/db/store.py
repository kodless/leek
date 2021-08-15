from typing import List, Union, Optional
from dataclasses import dataclass, field

QUEUED = "QUEUED"
RECEIVED = "RECEIVED"
STARTED = "STARTED"
SUCCEEDED = "SUCCEEDED"
FAILED = "FAILED"
REJECTED = "REJECTED"
REVOKED = "REVOKED"
RETRY = "RETRY"

# CUSTOM STATES
RECOVERED = "RECOVERED"  # Succeeded after many retries
CRITICAL = "CRITICAL"  # Failed after max retries

STATES_TERMINAL = frozenset([SUCCEEDED, FAILED, REJECTED, REVOKED, RECOVERED, CRITICAL])
STATES_SUCCESS = frozenset([SUCCEEDED, RECOVERED])
STATES_EXCEPTION = frozenset([FAILED, RETRY, REJECTED, REVOKED, CRITICAL])
STATES_UNREADY = frozenset([QUEUED, RECEIVED, STARTED])


class EventKind:
    TASK = "task"
    WORKER = "worker"


class WorkerStateFields:
    # -- No need to update this fields if coming task is out of order
    SHARED = (
        "_id", "app_env", "kind", "state", "hostname", "clock", "timestamp", "exact_timestamp", "utcoffset", "pid",
        "sw_ident", "sw_ver", "sw_sys",
    )
    # -- Safe
    ONLINE = ("online_at",)
    HEARTBEAT = ("last_heartbeat_at", "processed", "active", "freq", "loadavg")
    OFFLINE = ("offline_at",)


class TaskStateFields:
    # -- No need to update this fields if coming task is out of order
    SHARED = ("_id", "app_env", "kind", "state", "uuid", "clock", "timestamp", "exact_timestamp", "utcoffset", "pid")
    # -- Shared between states
    QUEUED_RECEIVED = ("name", "args", "kwargs", "root_id", "parent_id", "eta", "expires", "retries")
    FAILED_RETRY = ("exception", "traceback")
    # -- Safe
    NOT_QUEUED = ("worker",)
    QUEUED = ("queued_at", "exchange", "routing_key", "queue", "client",)
    RECEIVED = ("received_at",)
    STARTED = ("started_at",)
    RETRY = ("retried_at",)
    # TERMINAL STATES
    SUCCEEDED = ("succeeded_at", "result", "runtime",)
    FAILED = ("failed_at",)
    REJECTED = ("rejected_at", "requeue",)
    REVOKED = ("revoked_at", "terminated", "expired", "signum")


@dataclass()
class EV:
    id: str
    app_env: str
    kind: str
    state: str
    clock: str
    timestamp: Union[int, str]
    exact_timestamp: float
    utcoffset: int
    pid: int

    def to_doc(self):
        doc = {k: v for k, v in self.__dict__.items() if v is not None}
        _id = doc.pop("id")
        return _id, doc

    def update(self, coming: Union["Task", "Worker"]):
        for key, value in coming.__dict__.items():
            if value is not None:
                setattr(self, key, value)


@dataclass
class Worker(EV):
    # BASIC
    hostname: str
    # TIMESTAMPS
    online_at: int = None
    offline_at: int = None
    last_heartbeat_at: int = None
    # SOFTWARE
    sw_ident: str = None
    sw_ver: str = None
    sw_sys: str = None
    # STATS
    processed: int = None
    active: int = None
    freq: float = None
    loadavg: List[float] = None
    events_count: Optional[int] = 1


@dataclass
class Task(EV):
    # BASIC
    uuid: str
    name: Optional[str] = None
    # INPUT
    args: Optional[str] = None
    kwargs: Optional[str] = None
    # OUTPUT
    result: Optional[str] = None
    runtime: Optional[float] = None
    # DEPENDENCIES
    root_id: Optional[str] = None
    parent_id: Optional[str] = None
    # ROUTING
    exchange: Optional[str] = None
    routing_key: Optional[str] = None
    queue: Optional[str] = None
    # RETRIES
    eta: Optional[Union[int, str]] = None
    expires: Optional[Union[int, str]] = None
    retries: Optional[int] = None
    # TIMESTAMPS
    queued_at: Optional[Union[int, str]] = None
    received_at: Optional[Union[int, str]] = None
    started_at: Optional[Union[int, str]] = None
    succeeded_at: Optional[Union[int, str]] = None
    failed_at: Optional[Union[int, str]] = None
    rejected_at: Optional[Union[int, str]] = None
    revoked_at: Optional[Union[int, str]] = None
    retried_at: Optional[Union[int, str]] = None
    # REVOCATION
    terminated: Optional[bool] = None
    expired: Optional[bool] = None
    signum: Optional[str] = None
    # REJECTION
    requeue: Optional[bool] = None
    # FAILURE
    exception: Optional[str] = None
    traceback: Optional[str] = None
    # ORIGIN
    client: Optional[str] = None
    worker: Optional[str] = None
    events: Optional[List[str]] = field(default_factory=lambda: [])
    events_count: Optional[int] = 1


@dataclass()
class FanoutTrigger:
    id: str
    enabled: bool
    slack_wh_url: str
    type: str = "slack"
    states: List = field(default_factory=lambda: [])
    envs: List = field(default_factory=lambda: [])
    exclude: str = field(default_factory=lambda: [])
    include: str = field(default_factory=lambda: [])
    runtime_upper_bound: float = 0


@dataclass()
class Application:
    app_name: str
    app_key: str
    app_description: str
    created_at: str
    owner: str
    fo_triggers: List[FanoutTrigger] = field(default_factory=lambda: [])
