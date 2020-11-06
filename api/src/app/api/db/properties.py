properties = {
    # Shared
    "kind": {
        "type": "keyword",
    },
    "state": {
        "type": "keyword",
    },
    "hostname": {
        "type": "keyword",
    },
    "timestamp": {
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
    "eta": {
        "type": "date"
    },
    "expires": {
        "type": "double"
    },
    "sent_at": {
        "type": "double"
    },
    "received_at": {
        "type": "double"
    },
    "started_at": {
        "type": "double"
    },
    "succeeded_at": {
        "type": "double"
    },
    "failed_at": {
        "type": "double"
    },
    "rejected_at": {
        "type": "double"
    },
    "revoked_at": {
        "type": "double"
    },
    "retried_at": {
        "type": "double"
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
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
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
    # Broker specific
    "exchange": {
        "type": "keyword",
    },
    "routing_key": {
        "type": "keyword",
    }
}
