properties = {
    # Shared
    "kind": {
        "type": "keyword",
    },
    "state": {
        "type": "keyword",
    },
    "timestamp": {
        "type": "long"
    },
    "exact_timestamp": {
        "type": "long"
    },
    "utcoffset": {
        "type": "long"
    },
    "pid": {
        "type": "long"
    },
    "clock": {
        "type": "long"
    },
    "app_env": {
        "type": "keyword"
    },
    # Tasks specific
    "uuid": {
        "type": "keyword",
    },
    "root_id": {
        "type": "keyword",
    },
    "parent_id": {
        "type": "keyword",
    },
    "name": {
        "type": "keyword",
    },
    "worker": {
        "type": "keyword",
    },
    "client": {
        "type": "keyword",
    },
    # Times
    "eta": {
        "type": "long"
    },
    "expires": {
        "type": "long"
    },
    "queued_at": {
        "type": "long"
    },
    "received_at": {
        "type": "long"
    },
    "started_at": {
        "type": "long"
    },
    "succeeded_at": {
        "type": "long"
    },
    "failed_at": {
        "type": "long"
    },
    "rejected_at": {
        "type": "long"
    },
    "revoked_at": {
        "type": "long"
    },
    "retried_at": {
        "type": "long"
    },
    "args": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "kwargs": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "result": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "runtime": {
        "type": "double"
    },
    "retries": {
        "type": "long"
    },
    "exception": {
        "type": "keyword",
    },
    "traceback": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    # Workers specific
    "hostname": {
        "type": "keyword",
    },
    "online_at": {
        "type": "double"
    },
    "offline_at": {
        "type": "double"
    },
    "last_heartbeat_at": {
        "type": "double"
    },
    "processed": {
        "type": "long"
    },
    "active": {
        "type": "long"
    },
    "loadavg": {
        "type": "float"
    },
    "freq": {
        "type": "float"
    },
    "sw_ident": {
        "type": "keyword"
    },
    "sw_sys": {
        "type": "keyword",
    },
    "sw_ver": {
        "type": "keyword",
    },
    # -- For revoked tasks
    "terminated": {
        "type": "boolean",
    },
    "expired": {
        "type": "boolean",
    },
    "signum": {
        "type": "keyword",
    },
    # -- For rejected tasks
    "requeue": {
        "type": "boolean",
    },
    # Broker specific
    "exchange": {
        "type": "keyword",
    },
    "routing_key": {
        "type": "keyword",
    },
    "queue": {
        "type": "keyword",
    },
}
