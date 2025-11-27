# TODO: centralize this duplicated properties definition into a single place
def get_properties(search_backend):
    return {
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
        "name_parts": {
            "properties": {
                "function": {
                    "type": "keyword",
                    "fields": {
                        "wc": {"type": "wildcard"}
                    }
                },
                "module": {
                    "type": "keyword",
                    "fields": {
                        "wc": {"type": "wildcard"}
                    }
                }
            }
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
            "type": "keyword",
        },
        "kwargs": {
            "type": "keyword",
        },
        # Promote the first 10 positions into dedicated fields. Great for dashboards and hot filters.
        # Blazing fast exact filters/aggregations; simple queries; no nested overhead.
        "args_0": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_1": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_2": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_3": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_4": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_5": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_6": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_7": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_8": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        "args_9": {"type": "keyword", "ignore_above": 256, "fields": {"wc": {"type": "wildcard"}}},
        # Scalable and without mapping explosion
        "kwargs_flattened": {
            "type": "flattened" if search_backend == "elasticsearch" else "flat_object",
        },
        "result": {
            "type": "keyword"
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
            "type": "keyword"
        },
        "lang": {"type": "keyword"},
        "trace": {
            "properties": {
                "raw": {"type": "keyword", "index": False},
                "text": {"type": "text", "index_options": "freqs", "norms": False},
                "wc": {"type": "wildcard"}
            }
        },
        "error": {
            "properties": {
                "type": {
                    "type": "keyword",
                    "fields": {
                        "wc": {"type": "wildcard"}
                    }
                },
                "message": {
                    "type": "text",
                    "norms": False,
                    "fields": {"keyword": {"type": "keyword", "ignore_above": 32766}}
                }
            }
        },
        "stack": {
            "type": "nested",
            "properties": {
                "function": {"type": "keyword"},
                "file": {"type": "keyword"},
                "module": {"type": "keyword"},
                "line": {"type": "integer"}
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
