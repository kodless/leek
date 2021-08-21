properties = {
    # Shared
    "kind": {
        "type": "keyword",
    },
    "state": {
        "type": "keyword",
    },
    "timestamp": {
        "type": "date",
        "format": "epoch_millis"
    },
    "exact_timestamp": {
        "type": "double"
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
    "events": {
        "type": "keyword",
    },
    "events_count": {
        "type": "long"
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
        "type": "date",
        "format": "epoch_millis"
    },
    "expires": {
        "type": "date",
        "format": "epoch_millis"
    },
    "queued_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "received_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "started_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "succeeded_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "failed_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "rejected_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "revoked_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "retried_at": {
        "type": "date",
        "format": "epoch_millis"
    },
    "args": {
        "type": "wildcard",
    },
    "kwargs": {
        "type": "wildcard",
    },
    "result": {
        "type": "wildcard"
    },
    "runtime": {
        "type": "double"
    },
    "retries": {
        "type": "long"
    },
    "exception": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "traceback": {
        "type": "wildcard"
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
