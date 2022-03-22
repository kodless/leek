from typing import List, Optional
from dataclasses import dataclass

from leek.agent.models.event import EV


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

    def resolve_conflict(self, coming: "Worker"):
        # Get safe attrs from coming task
        attrs_to_upsert = list(getattr(WorkerStateFields, coming.state))
        # Merge
        for key, value in coming.__dict__.items():
            if value is not None and key in attrs_to_upsert:
                setattr(self, key, value)

    def merge(self, coming: "Worker"):
        events_count = self.events_count
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

        # Increment events count
        self.events_count = events_count + 1

        return merged
