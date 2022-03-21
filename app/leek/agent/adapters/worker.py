import fastjsonschema
from schema import Schema, And, Or, Optional

WORKER_EVENT_TYPES = (
    "worker-online",
    "worker-heartbeat",
    "worker-offline"
)

WORKER_STATE_MAPPING = {
    "worker-online": "ONLINE",
    "worker-heartbeat": "HEARTBEAT",
    "worker-offline": "OFFLINE",
}

WorkerEventSchema = Schema(
    {
        "type": Or(
            *WORKER_EVENT_TYPES
        ),
        "hostname": And(str, len),
        "timestamp": And(float),
        "utcoffset": And(int),
        "pid": And(int),
        "clock": And(int),
        "freq": And(Or(float, int)),
        Optional("active", default=None): And(int),
        Optional('processed', default=None): And(int),
        Optional('loadavg', default=None): And(list),
        "sw_ident": And(str),
        "sw_ver": And(str),
        "sw_sys": And(str),
    }
)

json_schema = WorkerEventSchema.json_schema("https://tryleek.com/schemas/worker.json")
CompiledWorkerEventSchema = fastjsonschema.compile(json_schema)
