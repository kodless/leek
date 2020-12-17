import json
import logging
import os
import signal
import subprocess
import uuid

import requests
import time
from printy import printy

"""
PRINT APPLICATION HEADER
"""

logging.basicConfig(level="INFO", format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


def abort(msg):
    logger.error(msg)
    os.kill(1, signal.SIGTERM)


def get_bool(env_name, default="false"):
    return os.environ.get(env_name, default).lower() == "true"


def get_status(b):
    return "[n>]ENABLED@" if b else "[r>]DISABLED@"


LEEK_VERSION = os.environ.get("LEEK_VERSION", "-.-.-")
ENABLE_ES = get_bool("LEEK_ENABLE_ES")
ENABLE_API = get_bool("LEEK_ENABLE_API")
ENABLE_AGENT = get_bool("LEEK_ENABLE_AGENT")
ENABLE_WEB = get_bool("LEEK_ENABLE_WEB")
LEEK_ES_URL = os.environ.get("LEEK_ES_URL", "http://0.0.0.0:9200")
LEEK_API_URL = os.environ.get("LEEK_API_URL", "http://0.0.0.0:5000")
LEEK_WEB_URL = os.environ.get("LEEK_WEB_URL", "http://0.0.0.0:80")

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
[b>]|#|@     [y>]Leek Celery Monitoring Tool@                     [b>]|#|@
[b>]|#|@     [n>]Versions:@ {LEEK_VERSION}                                 [b>]|#|@
[b>]|#|@     [n>]Release date:@ 1.0.0                             [b>]|#|@
[b>]|#|@     [n>]Codename:@ Fennec                                [b>]|#|@
[b>]|#|@     [n>]Repository:@ https://github.com/kodless/leek     [b>]|#|@
[b>]|#|@     [n>]Homepage:@ https://leek.kodhive.com              [b>]|#|@
[b>]|#|@     [n>]Documentation:@ https://leek.kodhive.com/docs    [b>]|#|@

[r>]Author:@ Hamza Adami <me@adamihamza.com>
[r>]Follow me on Github:@ https://github.com/kodless 
[r>]Buy me a coffee:@ https://buymeacoffee.com/fennec
"""
SERVICES = f"""
[y>]SERVICE     STATUS      URL
=======     ------      ---@
- ES        {get_status(ENABLE_ES)}    {LEEK_ES_URL}
- API       {get_status(ENABLE_API)}    {LEEK_API_URL}
- WEB       {get_status(ENABLE_WEB)}    {LEEK_WEB_URL}
- AGENT     {get_status(ENABLE_ES)}    -
"""

printy(LOGO, "n>B")
printy(USAGE)
printy(SERVICES)

"""
ADAPT/VALIDATE VARIABLES
"""
# WEB VARIABLES
if ENABLE_WEB:
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
        "LEEK_FIREBASE_PROJECT_ID": "{LEEK_FIREBASE_PROJECT_ID or "kodhive-leek"}",
        "LEEK_FIREBASE_APP_ID": "{LEEK_FIREBASE_APP_ID or "1:894368938723:web:e14677d1835ce9bd09e3d6"}",
        "LEEK_FIREBASE_API_KEY": "{LEEK_FIREBASE_API_KEY or "AIzaSyBiv9xF6VjDsv62ufzUb9aFJUreHQaFoDk"}",
        "LEEK_FIREBASE_AUTH_DOMAIN": "{LEEK_FIREBASE_AUTH_DOMAIN or "kodhive-leek.firebaseapp.com"}",
    }};
    """

    web_conf_file = "/opt/app/leek/public/leek-config.js"
    with open(web_conf_file, 'w') as f:
        f.write(web_conf)

# AGENT VARIABLES
if ENABLE_AGENT:
    subscriptions = os.environ.get("LEEK_AGENT_SUBSCRIPTIONS")
    if subscriptions:
        subscriptions = json.loads(subscriptions)
        if not isinstance(subscriptions, dict):
            abort(f"Agent subscriptions should be a dict of subscriptions")

        if ENABLE_API and ENABLE_AGENT:
            # Agent and API in the same runtime, prepare a shared secret for communication between them
            for subscription_name, subscription in subscriptions.items():
                subscription["app_key"] = os.environ["LEEK_AGENT_API_SECRET"]
                subscription["api_url"] = LEEK_API_URL

        # Validate each subscription
        for subscription_name, subscription in subscriptions.items():
            required_keys = ["broker", "exchange", "queue", "routing_key", "org_name",
                             "app_name", "app_env", "app_key", "api_url"]
            keys = subscription.keys()
            if not all(required_key in keys for required_key in required_keys):
                abort(f"Agent subscription configuration is invalid")

        subscriptions_file = "/opt/app/conf/subscriptions.json"
        with open(subscriptions_file, 'w') as f:
            json.dump(subscriptions, f, indent=4, sort_keys=False)
    else:
        logger.warning(f"LEEK_AGENT_SUBSCRIPTIONS environment variable is not set, Using default subscription.")

"""
START SERVICES AND ENSURE CONNECTIONS BETWEEN THEM
"""


def ensure_connection(target):
    for i in range(10):
        try:
            requests.options(url=target).raise_for_status()
            return
        except Exception as e:
            time.sleep(5)
            continue
    raise abort(f"Could not connect to target {target}")


if ENABLE_ES:
    # Start local elasticsearch cluster if local es db is enabled.
    # To ensure persistent storage, please use a external ES cluster and avoid local db.
    subprocess.run(["supervisorctl", "start", "es"])

if ENABLE_API:
    # Make sure ES (whether it is local or external) is up before starting the API.
    ensure_connection(LEEK_ES_URL)
    # Start API process
    subprocess.run(["supervisorctl", "start", "api"])
    # Make sure the API is up before starting the agent
    ensure_connection(f"{LEEK_API_URL}/v1/events/process")

if ENABLE_AGENT:
    # Start agent.
    # If you don't have access to brokers infrastructure, you can setup standalone agent on third party infra
    subprocess.run(["supervisorctl", "start", "agent"])

if ENABLE_WEB:
    # Start web application
    # If you don't want to spin up the web with the same runtime as API, you can deploy it on a cdn like Netlify
    subprocess.run(["supervisorctl", "start", "web"])
