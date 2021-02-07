import os
import uuid


def get_list(env_name):
    return [x for x in os.environ.get(env_name, "").split(",") if x]


def get_bool(env_name):
    return os.environ.get(env_name) == "true"


# ES
LEEK_ES_URL = os.environ.get("LEEK_ES_URL")

# Authentication/Authorization
LEEK_API_OWNER_ORG = os.environ["LEEK_API_OWNER_ORG"]
LEEK_API_WHITELISTED_ORGS = get_list("LEEK_API_WHITELISTED_ORGS")
LEEK_FIREBASE_PROJECT_ID = os.environ["LEEK_FIREBASE_PROJECT_ID"]
LEEK_API_AUTHORIZED_AUDIENCES = [LEEK_FIREBASE_PROJECT_ID, ]

# Web
LEEK_API_URL = "http://0.0.0.0:5000"
LEEK_WEB_URL = os.environ["LEEK_WEB_URL"]
LEEK_AGENT_API_SECRET = os.environ.get("LEEK_AGENT_API_SECRET", str(uuid.uuid4()))
LEEK_ENABLE_AGENT = get_bool("LEEK_ENABLE_AGENT")
