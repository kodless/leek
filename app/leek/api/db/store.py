from typing import List
from dataclasses import dataclass

QUEUED = "QUEUED"
RECEIVED = "RECEIVED"
STARTED = "STARTED"
SUCCEEDED = "SUCCEEDED"
FAILED = "FAILED"
REJECTED = "REJECTED"
REVOKED = "REVOKED"
RETRY = "RETRY"

TERMINAL = (SUCCEEDED, FAILED, REJECTED, REVOKED)


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

    def to_doc(self):
        doc = {k: v for k, v in self.__dict__.items() if v is not None}
        _id = doc.pop("id")
        return _id, doc


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


@dataclass
class Task(EV):
    # BASIC
    uuid: str
    name: str = None
    # INPUT
    args: str = None
    kwargs: str = None
    # OUTPUT
    result: str = None
    runtime: float = None
    # DEPENDENCIES
    root_id: str = None
    parent_id: str = None
    # ROUTING
    exchange: str = None
    routing_key: str = None
    queue: str = None
    # RETRIES
    eta: int = None
    expires: int = None
    retries: int = None
    # TIMESTAMPS
    sent_at: int = None
    received_at: int = None
    started_at: int = None
    succeeded_at: int = None
    failed_at: int = None
    rejected_at: int = None
    revoked_at: int = None
    retried_at: int = None
    # REVOCATION
    terminated: bool = None
    expired: bool = None
    signum: int = None
    # FAILURE
    exception: str = None
    traceback: str = None
    # ORIGIN
    client: str = None
    worker: str = None
