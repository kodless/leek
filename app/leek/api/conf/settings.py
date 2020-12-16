import os


def get_list(env_name):
    return [x for x in os.environ.get(env_name, "").split(",") if x]


def get_bool(env_name):
    return os.environ.get(env_name) == "true"


# General
LEEK_ENV = os.environ.get("LEEK_ENV")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# ES
LEEK_ES_URL = os.environ.get("LEEK_ES_URL")
LEEK_ES_CREATE_LIFECYCLE_AFTER_CONNECTION = get_bool("LEEK_ES_CREATE_LIFECYCLE_AFTER_CONNECTION")

# Authentication/Authorization
LEEK_API_AUTHORIZED_AUDIENCES = os.environ.get("LEEK_API_AUTHORIZED_AUDIENCES", "")
LEEK_API_OWNER_ORG = os.environ["LEEK_API_OWNER_ORG"]
LEEK_API_WHITELISTED_ORGS = get_list("LEEK_API_WHITELISTED_ORGS")

# Web
LEEK_WEB_URL = os.environ["LEEK_WEB_URL"]
