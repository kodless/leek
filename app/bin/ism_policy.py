from typing import List


def get_ism_policy(
        index_patterns: List,
        rollover_min_size: str = "32gb",
        rollover_min_doc_count: int = 50000000,
        delete_min_index_age: str = "14d",
        slack_webhook_url: str = None,
):
    error_notification = {
        "destination": {
            "slack": {
                "url": slack_webhook_url
            }
        },
        "message_template": {
            "source": "The index {{ctx.index}} failed during policy execution."
        }
    } if slack_webhook_url else None
    rollover = {}
    if rollover_min_size:
        rollover["min_size"] = rollover_min_size
    if rollover_min_doc_count:
        rollover["min_doc_count"] = rollover_min_doc_count
    return {
        "policy": {
            "description": "Rollover indices to prevent growth and search/index latency",
            "error_notification": error_notification,
            "default_state": "ingest",
            "ism_template": {
                "index_patterns": index_patterns,
                "priority": 0
            },
            "states": [
                {
                    "name": "ingest",
                    "actions": [
                        {
                            "rollover": rollover
                        }
                    ],
                    "transitions": [
                        {
                            "state_name": "search"
                        }
                    ]
                },
                {
                    "name": "search",
                    "actions": [],
                    "transitions": [
                        {
                            "state_name": "delete",
                            "conditions": {
                                "min_index_age": delete_min_index_age
                            }
                        }
                    ]
                },
                {
                    "name": "delete",
                    "actions": [
                        {
                            "delete": {}
                        }
                    ],
                    "transitions": []
                }
            ]
        }
    }


def get_ilm_policy(
        rollover_min_size: str = "32gb",
        rollover_min_doc_count: int = 50000000,
        delete_min_index_age: str = "14d",
):
    rollover = {}
    if rollover_min_size:
        rollover["max_size"] = rollover_min_size
    if rollover_min_doc_count:
        rollover["max_docs"] = rollover_min_doc_count
    return {
        "policy": {
            "phases": {
                "hot": {
                    "actions": {
                        "rollover": rollover
                    }
                },
                "delete": {
                    "min_age": delete_min_index_age,
                    "actions": {
                        "delete": {}
                    }
                }
            }
        }
    }
