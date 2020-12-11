import os


def get_list(env_name):
    return [x for x in os.environ.get(env_name, "").split(",") if x]


def get_bool(env_name):
    return os.environ.get(env_name) == "true"


# General
ENV = os.environ.get("ENV")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# ES
LEEK_ES_DOMAIN_URL = os.environ.get("LEEK_ES_DOMAIN_URL")
ES_CREATE_LIFECYCLE_AFTER_CONNECTION = get_bool("ES_CREATE_LIFECYCLE_AFTER_CONNECTION")

# Authentication/Authorization
LEEK_AUTHORIZED_AUDIENCES = os.environ.get("LEEK_AUTHORIZED_AUDIENCES", "")

# Web
LEEK_WEB_URL = os.environ["LEEK_WEB_URL"]
LEEK_OWNER_ORG = os.environ["LEEK_OWNER_ORG"]
LEEK_WHITELISTED_ORGS = get_list("LEEK_WHITELISTED_ORGS")
