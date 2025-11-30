import logging
import os
import signal
import sys
from typing import Literal

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError

logging.basicConfig(level="INFO", format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)

Backend = Literal["elasticsearch", "opensearch"]


def abort(msg):
    logger.error(msg)
    os.kill(1, signal.SIGTERM)
    sys.exit(1)


def get_leek_org_available_index_templates(es: Elasticsearch, org_prefix):
    try:
        templates = es.indices.get_index_template(name=f"{org_prefix}*")
        return [t["name"] for t in templates["index_templates"]]
    except NotFoundError:
        logger.info(f"No index template found for org '{org_prefix}', skipping migration and transform creation.")
        return []
