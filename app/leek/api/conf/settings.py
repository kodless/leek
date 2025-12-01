import os
import uuid


def get_list(env_name):
    return [x for x in os.environ.get(env_name, "").split(",") if x]


def get_bool(env_name, default="false"):
    return os.environ.get(env_name, default).lower() == "true"


LEEK_API_LOG_LEVEL = os.environ.get("LEEK_API_LOG_LEVEL", "INFO")

# ES
LEEK_ES_URL = os.environ.get("LEEK_ES_URL")
LEEK_ES_DEFAULT_REFRESH_INTERVAL = os.environ.get("LEEK_ES_DEFAULT_REFRESH_INTERVAL", "20s")
LEEK_ES_IM_ENABLE = get_bool("LEEK_ES_IM_ENABLE", default="false")

# Authentication/Authorization
LEEK_API_ENABLE_AUTH = get_bool("LEEK_API_ENABLE_AUTH", "true")
LEEK_API_OWNER_ORG = os.environ.get("LEEK_API_OWNER_ORG")
LEEK_API_WHITELISTED_ORGS = get_list("LEEK_API_WHITELISTED_ORGS")
LEEK_FIREBASE_PROJECT_ID = os.environ.get("LEEK_FIREBASE_PROJECT_ID")
LEEK_API_AUTHORIZED_AUDIENCES = [LEEK_FIREBASE_PROJECT_ID, ]

# Web
LEEK_API_URL = "http://0.0.0.0:5000"
LEEK_WEB_URL = os.environ["LEEK_WEB_URL"]
LEEK_AGENT_API_SECRET = os.environ.get("LEEK_AGENT_API_SECRET", str(uuid.uuid4()))
LEEK_ENABLE_AGENT = get_bool("LEEK_ENABLE_AGENT")

# Control
LEEK_CONTROL_EXCHANGE_NAME = os.environ.get("LEEK_CONTROL_EXCHANGE_NAME", "celery")

# Create app if not exist, only supported when leek auth is disabled.
# This is useful for dev / demo environments when developers want to kickstart the stack
# without worrying about manual interventions like creating leek app from Leek UI.
LEEK_CREATE_APP_IF_NOT_EXIST = get_bool("LEEK_CREATE_APP_IF_NOT_EXIST", default="false")

# Explicitly disable fanout triggers
LEEK_DISABLE_FANOUT_TRIGGERS = get_bool("LEEK_DISABLE_FANOUT_TRIGGERS", default="false")
