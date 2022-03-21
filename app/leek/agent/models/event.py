import abc
from typing import Union
from dataclasses import dataclass


class EventKind:
    TASK = "task"
    WORKER = "worker"


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
        return {k: v for k, v in self.__dict__.items() if v is not None}

    def update(self, coming):
        for key, value in coming.__dict__.items():
            if value is not None:
                setattr(self, key, value)

    @abc.abstractmethod
    def resolve_conflict(self, coming):
        pass
