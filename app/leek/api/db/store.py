import abc
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
    SUCCEEDED = ("succeeded_at", "result", "runtime",)
    FAILED = ("failed_at",)
    RETRY = ("retried_at",)
    REJECTED = ("rejected_at", "requeue",)
    REVOKED = ("revoked_at", "terminated", "expired", "signum")


@dataclass()
class EV:
    id: str
    app_env: str
    kind: str
    state: str
    clock: str
    timestamp: int
    exact_timestamp: float
    utcoffset: int
    pid: int

    @abc.abstractmethod
    def resolve_conflict(self, coming: Union["Task", "Worker"]):
        pass

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

    def resolve_conflict(self, coming: "Worker"):
        # Get safe attrs from coming task
        attrs_to_upsert = list(getattr(TaskStateFields, coming.state))
        # Merge
        for key, value in coming.__dict__.items():
            if value is not None and key in attrs_to_upsert:
                setattr(self, key, value)

    def merge(self, coming: Union["Task", "Worker"]):
        in_order = self.exact_timestamp < coming.exact_timestamp
        # self is the currently stored/indexed doc
        if in_order:
            # The two documents are in order, Safe to merge
            self.update(coming)
            merged = True
        elif not in_order and self.state == coming.state:
            # The two documents are out of order and has the same state => Skip
            merged = False
        else:
            # The two documents are out of order and has different states => Resolve conflict and merge
            self.resolve_conflict(coming)
            merged = True
        return merged


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
    eta: Optional[int] = None
    expires: Optional[int] = None
    retries: Optional[int] = None
    # TIMESTAMPS
    queued_at: Optional[int] = None
    received_at: Optional[int] = None
    started_at: Optional[int] = None
    succeeded_at: Optional[int] = None
    failed_at: Optional[int] = None
    rejected_at: Optional[int] = None
    revoked_at: Optional[int] = None
    retried_at: Optional[int] = None
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

    def resolve_conflict(self, coming: "Task"):
        # print(f"DETECTED CONFLICT {self.state} {coming.state} {coming.uuid}")
        attrs_to_upsert = []
        # Get safe attrs from coming task
        attrs_to_upsert += list(getattr(TaskStateFields, coming.state))
        # States with same attrs
        if coming.state in [FAILED, RETRY]:
            if self.state not in [FAILED, RETRY, CRITICAL]:
                attrs_to_upsert += list(TaskStateFields.FAILED_RETRY)
        elif coming.state in [QUEUED, RECEIVED]:
            if self.state not in [QUEUED, RECEIVED]:
                attrs_to_upsert += list(TaskStateFields.QUEUED_RECEIVED)
        # Merge
        for key, value in coming.__dict__.items():
            if value is not None and key in attrs_to_upsert:
                setattr(self, key, value)

    def merge(self, coming: Union["Task", "Worker"]):
        in_order = self.exact_timestamp < coming.exact_timestamp
        # self is the currently stored/indexed doc
        if in_order:
            if self.state in STATES_TERMINAL:
                # The task is already in terminal state, Resolve conflict and merge
                # This can be caused if the timestamp of the new event is inaccurate
                # Or if the workers/clients are not synchronized
                if self.state != REVOKED:
                    print(
                        f"DETECTED CONFLICT {self.state} {coming.state} {coming.uuid} {self.exact_timestamp} {coming.exact_timestamp}")
                    print(self)
                    print(coming)
                self.resolve_conflict(coming)
                merged = True
            else:
                # The two documents are in physical clock order and in state order, Safe to merge
                self.update(coming)
                merged = True
        elif not in_order and self.state == coming.state:
            # The two documents are out of order and has the same state => Skip
            merged = False
        else:
            # The two documents are out of order and has different states => Resolve conflict and merge
            self.resolve_conflict(coming)
            merged = True

        # Introduce custom states
        if self.retries:
            if self.state == FAILED:
                self.state = CRITICAL
            if self.state == SUCCEEDED:
                self.state = RECOVERED

        # If parent/root is self fix
        if self.root_id and self.root_id == self.id:
            self.root_id = None
        if self.parent_id and self.parent_id == self.id:
            self.parent_id = None

        return merged


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
    broker: str
    broker_version: str
    fo_triggers: List[FanoutTrigger] = field(default_factory=lambda: [])
