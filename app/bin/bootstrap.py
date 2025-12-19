import json
import logging
import os
import subprocess

import requests
import time
from printy import printy
from elasticsearch import Elasticsearch
from ism_policy import setup_im_policy
from version import validate_supported_backend
from utils import abort, logger, get_leek_org_available_index_templates
from migration import migrate_index_templates
from summary import ensure_all_summary_indexes_with_mapping, ensure_all_indexes_summary_transform

"""
PRINT APPLICATION HEADER
"""


def get_bool(env_name, default="false"):
    return os.environ.get(env_name, default).lower() == "true"


def get_status(b):
    return "[n>]ENABLED@" if b else "[r>]DISABLED@"


LEEK_VERSION = os.environ.get("LEEK_VERSION", "-.-.-")
LEEK_RELEASE_DATE = os.environ.get("LEEK_RELEASE_DATE", "0000/00/00 00:00:00")
LEEK_ENV = os.environ.get("LEEK_ENV", "PROD")
ENABLE_ES = get_bool("LEEK_ENABLE_ES")
ENABLE_API = get_bool("LEEK_ENABLE_API")
ENABLE_AGENT = get_bool("LEEK_ENABLE_AGENT")
ENABLE_WEB = get_bool("LEEK_ENABLE_WEB")
ENABLE_DDTRACE = get_bool("LEEK_ENABLE_DDTRACE")
LEEK_ES_URL = os.environ.get("LEEK_ES_URL", "http://0.0.0.0:9200")
LEEK_ES_API_KEY = os.environ.get("LEEK_ES_API_KEY", None)
LEEK_ES_IM_ENABLE = get_bool("LEEK_ES_IM_ENABLE", default="false")
LEEK_ES_IM_SLACK_WEBHOOK_URL = os.environ.get("LEEK_ES_IM_SLACK_WEBHOOK_URL")
LEEK_ES_IM_ROLLOVER_MIN_SIZE = os.environ.get("LEEK_ES_IM_ROLLOVER_MIN_SIZE")
LEEK_ES_IM_ROLLOVER_MIN_DOC_COUNT = int(os.environ.get("LEEK_ES_IM_ROLLOVER_MIN_DOC_COUNT", 0))
LEEK_ES_IM_DELETE_MIN_INDEX_AGE = os.environ.get("LEEK_ES_IM_DELETE_MIN_INDEX_AGE", "7d")
LEEK_API_URL = os.environ.get("LEEK_API_URL", "http://0.0.0.0:5000")
LEEK_WEB_URL = os.environ.get("LEEK_WEB_URL", "http://0.0.0.0:8000")
LEEK_API_ENABLE_AUTH = get_bool("LEEK_API_ENABLE_AUTH", default="true")
LEEK_API_OWNER_ORG = os.environ.get("LEEK_API_OWNER_ORG")
LEEK_CREATE_APP_IF_NOT_EXIST = get_bool("LEEK_CREATE_APP_IF_NOT_EXIST", default="false")
LEEK_DISABLE_FANOUT_TRIGGERS = get_bool("LEEK_DISABLE_FANOUT_TRIGGERS", default="false")

LOGO = """
8 8888         8 8888888888   8 8888888888   8 8888     ,88'
8 8888         8 8888         8 8888         8 8888    ,88' 
8 8888         8 8888         8 8888         8 8888   ,88'  
8 8888         8 8888         8 8888         8 8888  ,88'   
8 8888         8 888888888888 8 888888888888 8 8888 ,88'    
8 8888         8 8888         8 8888         8 8888 88'     
8 8888         8 8888         8 8888         8 888888<      
8 8888         8 8888         8 8888         8 8888 `Y8.    
8 8888         8 8888         8 8888         8 8888   `Y8.  
8 888888888888 8 888888888888 8 888888888888 8 8888     `Y8.                        
"""
USAGE = f"""
[b>]|#|@     [y>]Leek Celery Monitoring Tool@                               [b>]|#|@
[b>]|#|@     [n>]Versions:@ {LEEK_VERSION}                                  [b>]|#|@
[b>]|#|@     [n>]Release date:@ {LEEK_RELEASE_DATE}                         [b>]|#|@
[b>]|#|@     [n>]Codename:@ Fennec                                          [b>]|#|@
[b>]|#|@     [n>]Repository:@ https://github.com/kodless/leek               [b>]|#|@
[b>]|#|@     [n>]Homepage:@ https://tryleek.com                             [b>]|#|@
[b>]|#|@     [n>]Documentation:@ https://tryleek.com/docs/introduction/leek [b>]|#|@

[r>]Author:@ Hamza Adami <me@adamihamza.com>
[r>]Follow me on Github:@ https://github.com/kodless 
[r>]Buy me a coffee:@ https://buymeacoffee.com/fennec
"""
SERVICES = f"""
[y>]SERVICE     STATUS      URL
=======     ------      ---@
- API       {get_status(ENABLE_API)}    {LEEK_API_URL}
- WEB       {get_status(ENABLE_WEB)}    {LEEK_WEB_URL}
- AGENT     {get_status(ENABLE_AGENT)}    -
"""

printy(LOGO, "n>B")
printy(USAGE)
printy(SERVICES)

"""
ADAPT/VALIDATE VARIABLES
"""

if ENABLE_ES:
    logger.warning("Starting from version 0.4.0 local elasticsearch is deprecated! This is to "
                   "improve leek docker image size.\n"
                   "If you are still interested in local elasticsearch you can use the official "
                   "ES docker image to run a sidecar elasticsearch container.")

# WEB VARIABLES
if ENABLE_WEB:
    if LEEK_API_ENABLE_AUTH is True:
        if LEEK_ENV == "PROD":
            LEEK_FIREBASE_PROJECT_ID = os.environ.get("LEEK_FIREBASE_PROJECT_ID")
            LEEK_FIREBASE_APP_ID = os.environ.get("LEEK_FIREBASE_APP_ID")
            LEEK_FIREBASE_API_KEY = os.environ.get("LEEK_FIREBASE_API_KEY")
            LEEK_FIREBASE_AUTH_DOMAIN = os.environ.get("LEEK_FIREBASE_AUTH_DOMAIN")
            none_fb_prams = [LEEK_FIREBASE_PROJECT_ID, LEEK_FIREBASE_APP_ID, LEEK_FIREBASE_API_KEY,
                             LEEK_FIREBASE_AUTH_DOMAIN].count(None)
            if 1 <= none_fb_prams <= 3:
                abort(
                    "If one of [LEEK_FIREBASE_PROJECT_ID, LEEK_FIREBASE_APP_ID, LEEK_FIREBASE_API_KEY, "
                    "LEEK_FIREBASE_AUTH_DOMAIN] is provided all should be provided, Or if you want to "
                    "use default firebase project do not set any of these env variables"
                )

            if none_fb_prams == 4:
                logger.warning("Using default firebase project for authentication!")

            web_conf = f"""
            window.leek_config = {{
                "LEEK_API_URL": "{LEEK_API_URL}",
                "LEEK_API_ENABLE_AUTH": "true",
                "LEEK_FIREBASE_PROJECT_ID": "{LEEK_FIREBASE_PROJECT_ID or "kodhive-leek"}",
                "LEEK_FIREBASE_APP_ID": "{LEEK_FIREBASE_APP_ID or "1:894368938723:web:e14677d1835ce9bd09e3d6"}",
                "LEEK_FIREBASE_API_KEY": "{LEEK_FIREBASE_API_KEY or "AIzaSyBiv9xF6VjDsv62ufzUb9aFJUreHQaFoDk"}",
                "LEEK_FIREBASE_AUTH_DOMAIN": "{LEEK_FIREBASE_AUTH_DOMAIN or "kodhive-leek.firebaseapp.com"}",
                "LEEK_VERSION": "{LEEK_VERSION}",
            }};
            """

            web_conf_file = "/opt/app/public/leek-config.js"
            with open(web_conf_file, 'w') as f:
                f.write(web_conf)
        else:
            logger.warning("Using default firebase project for authentication!")
    else:
        web_conf = f"""
        window.leek_config = {{
            "LEEK_API_URL": "{LEEK_API_URL}",
            "LEEK_API_ENABLE_AUTH": "false",
            "LEEK_VERSION": "{LEEK_VERSION}",
        }};
        """

        web_conf_file = "/opt/app/public/leek-config.js"
        with open(web_conf_file, 'w') as f:
            f.write(web_conf)


def infer_subscription_name(subscription):
    return f"{subscription.get('app_name')}-{subscription.get('app_env')}"


def infer_subscription_tags(subscription_name: str):
    app_name, app_env = subscription_name.split("-")
    return app_name, app_env


def validate_subscriptions(subs):
    # Validate type
    if isinstance(subs, dict):
        abort(f"Passing agent subscriptions as dict is deprecated, "
              f"now it should be provided as a list of subscriptions!")

    if not isinstance(subs, list):
        abort(f"Agent subscriptions should be a list of subscriptions!")

    # Validate required fields
    for subscription in subs:
        required_keys = [
            "broker", "broker_management_url", "exchange", "queue", "routing_key", "org_name",
            "app_name", "app_env",  # "app_key", "api_url"
        ]
        keys = subscription.keys()
        if not all(required_key in keys for required_key in required_keys):
            abort(f"Agent subscription configuration is invalid")

        if not (subscription["app_name"].isalpha() and subscription["app_name"].islower()):
            abort(f"app_name value should be lowercase alphabetic string")

        if not (subscription["app_env"].isalpha() and subscription["app_env"].islower()):
            abort(f"app_env value should be lowercase alphabetic string")

    # Validate uniqueness
    unique_counts = {}
    for subscription in subs:
        unique_counts[infer_subscription_name(subscription)] = unique_counts.get(
            infer_subscription_name(subscription), 0) + 1
    for subscription_name, count in unique_counts.items():
        if count > 1:
            app_name, app_env = infer_subscription_tags(subscription_name)
            abort(f"{count} subscriptions with the same app name [{app_name}]"
                  f" and app env [{app_env}] defined multiple times!")

    if ENABLE_API:
        # Agent and API in the same runtime, prepare a shared secret for communication between them
        for subscription in subs:
            try:
                subscription["app_key"] = os.environ["LEEK_AGENT_API_SECRET"]
            except KeyError:
                abort("Agent and API are both enabled in same container, LEEK_AGENT_API_SECRET env variable should "
                      "be specified for inter-communication between agent and API")
            # Use local API URL not from LEEK_API_URL env var, LEEK_API_URL is used by Web app (browser)
            subscription["api_url"] = "http://0.0.0.0:5000"

    # Optional settings
    for subscription in subs:
        subscription.setdefault("concurrency_pool_size", 1)
        subscription.setdefault("prefetch_count", 1000)
        subscription.setdefault("batch_max_size_in_mb", 1)
        subscription.setdefault("batch_max_number_of_messages", subscription["prefetch_count"])
        subscription.setdefault("batch_max_window_in_seconds", 5)

        if not LEEK_API_ENABLE_AUTH:
            subscription["org_name"] = "mono"

        if subscription["prefetch_count"] < 1000 or subscription["prefetch_count"] > 10000:
            abort("Subscription prefetch_count should be between 1,000 and 10,000 messages!")

        if subscription["batch_max_size_in_mb"] < 1 or subscription["batch_max_size_in_mb"] > 10:
            abort("Subscription batch_max_size_in_mb should be between 1 and 10 megabytes!")

        if subscription["batch_max_number_of_messages"] > subscription["prefetch_count"]:
            abort("Subscription batch_max_number_of_messages should be <= prefetch_count!")

        if subscription["batch_max_window_in_seconds"] < 5 or subscription["batch_max_window_in_seconds"] > 20:
            abort("Subscription batch_max_window_in_seconds should be between 5 and 20 seconds!")
    return subs


# AGENT VARIABLES
if ENABLE_AGENT:
    subscriptions_file = "/opt/app/conf/subscriptions.json"
    subscriptions = os.environ.get("LEEK_AGENT_SUBSCRIPTIONS")
    if subscriptions:
        try:
            subscriptions = json.loads(subscriptions)
        except json.decoder.JSONDecodeError:
            abort("LEEK_AGENT_SUBSCRIPTIONS env var should be a valid json string!")
        subscriptions = validate_subscriptions(subscriptions)
        with open(subscriptions_file, 'w') as f:
            json.dump(subscriptions, f, indent=4, sort_keys=False)
    else:
        with open(subscriptions_file) as s:
            try:
                subscriptions = json.load(s)
            except json.decoder.JSONDecodeError:
                abort("Subscription file should be a valid json file!")
            subscriptions = validate_subscriptions(subscriptions)
        if not len(subscriptions):
            logger.warning(f"LEEK_AGENT_SUBSCRIPTIONS environment variable is not set, and subscriptions file does not "
                           f"declare any subscriptions, Try adding subscriptions statically via env variable or "
                           f"dynamically via agent page {LEEK_WEB_URL}.")
        with open(subscriptions_file, 'w') as f:
            json.dump(subscriptions, f, indent=4, sort_keys=False)

"""
START SERVICES AND ENSURE CONNECTIONS BETWEEN THEM
"""


def create_painless_scripts(conn: Elasticsearch):
    with open('/opt/app/conf/painless/TaskMerge.groovy', 'r') as script:
        task_merge_source = script.read()

    with open('/opt/app/conf/painless/WorkerMerge.groovy', 'r') as script:
        worker_merge_source = script.read()

    try:
        t = conn.put_script(id="task-merge", body={
            "script": {
                "lang": "painless",
                "source": task_merge_source
            }
        })
        w = conn.put_script(id="worker-merge", body={
            "script": {
                "lang": "painless",
                "source": worker_merge_source
            }
        })
        if t["acknowledged"] is True and w["acknowledged"] is True:
            return
    except Exception:
        pass
    abort(f"Could not create painless scripts!")


def ensure_connection(target):
    for i in range(10):
        try:
            requests.options(url=target).raise_for_status()
            return
        except Exception as e:
            time.sleep(5)
            continue
    abort(f"Could not connect to target {target}")


def ensure_es_connection() -> Elasticsearch:
    logging.getLogger("elasticsearch").setLevel(logging.ERROR)
    conn = Elasticsearch(LEEK_ES_URL, api_key=LEEK_ES_API_KEY)
    for i in range(10):
        if conn.ping():
            logging.getLogger("elasticsearch").setLevel(logging.INFO)
            return conn
        time.sleep(5)
    else:
        abort(f"Could not connect to target {LEEK_ES_URL}")


if ENABLE_API:
    # Make sure ES (whether it is local or external) is up before starting the API.
    connection = ensure_es_connection()
    info = validate_supported_backend(connection)
    if LEEK_API_ENABLE_AUTH is False:
        index_prefix = "mono"
    else:
        index_prefix = LEEK_API_OWNER_ORG
    # Initialize indexes
    index_templates = get_leek_org_available_index_templates(connection, index_prefix)
    if len(index_templates):
        # Migrate Index Templates and Indexes (If changed)
        migrate_index_templates(connection, index_templates)
        # Create summary indexes for all index templates indexes (If not exist)
        ensure_all_summary_indexes_with_mapping(connection, index_templates)
        # Create summary transforms for all indexes and update sync config if changed
        ensure_all_indexes_summary_transform(
            backend=info["backend"],
            es_client=connection,
            leek_es_url=LEEK_ES_URL,
            templates=index_templates
        )
    # Creates index management policy for automatic rollover
    setup_im_policy(
        connection,
        info["backend"],
        enable_im=LEEK_ES_IM_ENABLE,
        rollover_min_size=LEEK_ES_IM_ROLLOVER_MIN_SIZE,
        rollover_min_doc_count=LEEK_ES_IM_ROLLOVER_MIN_DOC_COUNT,
        delete_min_index_age=LEEK_ES_IM_DELETE_MIN_INDEX_AGE,
        slack_webhook_url=LEEK_ES_IM_SLACK_WEBHOOK_URL
    )
    # Creates painless scripts used for merges
    create_painless_scripts(connection)
    # Close es connection
    connection.close()
    # Start API process
    subprocess.run(["supervisorctl", "start", "api"])
    # Make sure the API is up before starting the agent
    ensure_connection(f"http://0.0.0.0:5000/v1/events/process")

if ENABLE_AGENT:
    # Start agent.
    # If you don't have access to brokers infrastructure, you can setup standalone agent on third party infra
    subprocess.run(["supervisorctl", "start", "agent"])

if ENABLE_WEB:
    # Start web application
    # If you don't want to spin up the web with the same runtime as API, you can deploy it on a cdn like Netlify
    subprocess.run(["supervisorctl", "start", "web"])
