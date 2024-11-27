from typing import List, Union, Optional
from dataclasses import dataclass, field

from leek.agent.models.event import EV

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

TaskStateFields = dict(
    # -- No need to update this fields if coming task is out of order
    SHARED=("_id", "app_env", "kind", "state", "uuid", "clock", "timestamp", "exact_timestamp", "utcoffset", "pid"),
    # -- Shared between states
    QUEUED_RECEIVED=("name", "args", "kwargs", "root_id", "parent_id", "eta", "expires", "retries"),
    FAILED_RETRY=("exception", "traceback"),
    # -- Safe
    NOT_QUEUED=("worker",),
    QUEUED=("queued_at", "exchange", "routing_key", "queue", "client",),
    RECEIVED=("received_at",),
    STARTED=("started_at",),
    RETRY=("retried_at",),
    # TERMINAL STATES
    SUCCEEDED=("succeeded_at", "result", "runtime",),
    FAILED=("failed_at",),
    REJECTED=("rejected_at", "requeue",),
    REVOKED=("revoked_at", "terminated", "expired", "signum"),
)


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

    def resolve_conflict_late_events(self, coming: "Task"):
        """
        Case:
            - The task is already in terminal state, Resolve conflict and merge
            - However, another event came late with a non terminal state:
                - RETRY: Merge only if the Task not in FAILED or CRITICAL
                - QUEUED | RECEIVED:
        Note: This can happen if the events are queued our of order
        :param coming: Late non terminal event
        """
        # Get safe attrs from coming task
        attrs_to_upsert = list(TaskStateFields[coming.state])

        # States with same attrs
        if coming.state == RETRY:
            if self.state not in [FAILED, CRITICAL]:
                # update task with traceback/exception
                attrs_to_upsert += list(TaskStateFields["FAILED_RETRY"])
        elif coming.state in [QUEUED, RECEIVED]:
            attrs_to_upsert += list(TaskStateFields["QUEUED_RECEIVED"])

        # Merge
        for key, value in coming.__dict__.items():
            if value is not None and key in attrs_to_upsert:
                setattr(self, key, value)

    def resolve_conflict_wrong_timestamp(self, coming: "Task"):
        # Get safe attrs from coming task
        attrs_to_upsert = list(TaskStateFields[coming.state])

        # States with same attrs
        if coming.state == RETRY:
            if self.state != RETRY:
                # update task with traceback/exception
                attrs_to_upsert += list(TaskStateFields["FAILED_RETRY"])

        elif coming.state in [QUEUED, RECEIVED]:
            if self.state not in [QUEUED, RECEIVED]:
                attrs_to_upsert += list(TaskStateFields["QUEUED_RECEIVED"])

        # Merge
        for key, value in coming.__dict__.items():
            if value is not None and key in attrs_to_upsert:
                setattr(self, key, value)

    def handle_non_terminal_event(self, coming: "Task"):
        in_order = self.exact_timestamp < coming.exact_timestamp
        if in_order:
            # The two documents are in physical clock order and in state order, Safe to merge
            self.update(coming)
        elif self.state != coming.state:
            # The two documents are out of order and has different non terminal states => Resolve conflict and merge
            self.resolve_conflict_wrong_timestamp(coming)
        else:
            # The two documents are out of order and has the same state => Skip
            pass

    def merge(self, coming: "Task"):
        events_count = self.events_count
        events = self.events

        if coming.state in STATES_TERMINAL:
            # Coming terminal event is safe to merge, no need to compare clocks/timestamps
            self.update(coming)
        elif self.state in STATES_TERMINAL:
            # The task is already in terminal state, Resolve conflict and merge
            self.resolve_conflict_late_events(coming)
        else:
            # Handle non terminal events (Just merge | Resolve conflict and merge)
            self.handle_non_terminal_event(coming)

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

        # Increment events count
        self.events_count = events_count + 1
        # Record only past 21 task states transitions
        events = [coming.state, *events[0:20]]
        # Track the merge operation by the index (A)
        # events = [f"A:{coming.state}", *events[0:20]]
        self.events = events
