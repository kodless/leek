import logging

from elasticsearch import Elasticsearch

from leek.api.conf import settings
from leek.api.ext.base import BaseExtension

logger = logging.getLogger(__name__)


class ESExtension(BaseExtension):
    connection = None

    def init_app(self, app):
        app.extensions["es"] = self
        self.connection = Elasticsearch(settings.LEEK_ES_URL, api_key=settings.LEEK_ES_API_KEY)
        logger.info("Connected to elastic search backend!")
