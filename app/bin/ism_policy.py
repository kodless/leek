from typing import List

from elasticsearch import Elasticsearch, exceptions as es_exceptions
from utils import abort, logger

policy_name = "leek-rollover-policy"


def check_im_eligibility(conn: Elasticsearch):
    es_ver_info = conn.info()["version"]
    version_number = es_ver_info["number"]

    dist = None
    distribution = None
    im_endpoint = None
    if "build_flavor" in es_ver_info:
        if es_ver_info["build_flavor"] == "oss":
            dist = "OpenDistro"
            if version_number == "7.10.2":
                distribution = "OpenDistro>=1.13.0"
                im_endpoint = "/_opendistro/_ism/policies"
            else:
                distribution = "OpenDistro<1.13.0"
                abort(f"Leek does not support ISM with {distribution}")
        elif es_ver_info["build_flavor"] in ["default", "unknown"]:
            dist = "ElasticSearch"
            distribution = f"ElasticSearch={version_number}"
        else:
            distribution = "broken"
            abort(f"Leek does not support ISM with broken Elasticsearch distributions!")
    elif "distribution" in es_ver_info:
        if es_ver_info["distribution"] == "opensearch":
            dist = "OpenSearch"
            distribution = f"OpenSearch={version_number}"
            im_endpoint = "/_plugins/_ism/policies"
        else:
            abort(f"Leek does not support ISM with {es_ver_info['distribution']}")
    else:
        logger.warning(f"ElasticSearch build_flavor/distribution fields missing, fallback to OpenSearch! ${es_ver_info}")
        # will favor OpenSearch
        dist = "OpenSearch"
        distribution = f"OpenSearch={version_number}"
        im_endpoint = "/_plugins/_ism/policies"

    logger.info(f"Detected {distribution} as ElasticSearch distribution!")
    return dist, im_endpoint


def cleanup_im_policy(
        conn: Elasticsearch,
        dist: str,
        im_endpoint: str
):
    # Cleanup ISM/ILM policies
    try:
        if dist in ["OpenDistro", "OpenSearch"]:
            conn.transport.perform_request(
                "DELETE",
                f"{im_endpoint}/{policy_name}",
            )
        elif dist == "ElasticSearch":
            conn.ilm.remove_policy("*")
            conn.ilm.delete_lifecycle(policy_name)
    except es_exceptions.NotFoundError:
        pass


def setup_im_policy(
        conn: Elasticsearch,
        enable_im,
        rollover_min_size: str = "32gb",
        rollover_min_doc_count: int = 50000000,
        delete_min_index_age: str = "14d",
        slack_webhook_url: str = None,
):
    dist, im_endpoint = check_im_eligibility(conn)

    if not enable_im:
        cleanup_im_policy(conn, dist, im_endpoint)
        return

    if not rollover_min_doc_count and not rollover_min_size:
        abort(
            "One of or both LEEK_ES_IM_ROLLOVER_MIN_DOC_COUNT and LEEK_ES_IM_ROLLOVER_MIN_SIZE env var should be set!"
        )

    if dist in ["OpenDistro", "OpenSearch"]:
        params = {}
        try:
            seq_no, primary_term = get_ism_policy(conn, im_endpoint)
            params = {
                "if_seq_no": seq_no,
                "if_primary_term": primary_term
            }
        except es_exceptions.NotFoundError:
            print("Creating ISM policy for the first time!")

        policy = prepare_ism_policy(
            ["*"],
            rollover_min_size=rollover_min_size,
            rollover_min_doc_count=rollover_min_doc_count,
            delete_min_index_age=delete_min_index_age,
            slack_webhook_url=slack_webhook_url
        )
        for i in range(10):
            try:
                conn.transport.perform_request(
                    "PUT",
                    f"{im_endpoint}/{policy_name}",
                    body=policy,
                    params=params
                )
                return
            except es_exceptions.ConflictError:
                abort("Retrying new ISM policy version creation!")
                continue
        abort("Failed to update ISM policy!")

    elif dist == "ElasticSearch":
        policy = prepare_ilm_policy(
            rollover_min_size=rollover_min_size,
            rollover_min_doc_count=rollover_min_doc_count,
            delete_min_index_age=delete_min_index_age,
        )
        conn.ilm.put_lifecycle(policy_name, body=policy)


def prepare_ism_policy(
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


def prepare_ilm_policy(
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


def get_ism_policy(
        conn: Elasticsearch,
        endpoint: str,
):
    response = conn.transport.perform_request(
        "GET",
        f"{endpoint}/leek-rollover-policy",
    )
    return response["_seq_no"], response["_primary_term"]
