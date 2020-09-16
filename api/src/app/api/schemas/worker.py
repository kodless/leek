from schema import Schema, And, Or

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
        "freq": And(float),
        "active": And(int),
        "processed": And(int),
        "loadavg": And(list),
        "sw_ident": And(str),
        "sw_ver": And(str),
        "sw_sys": And(str),
    }
)
