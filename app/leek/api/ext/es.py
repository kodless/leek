import boto3
from elasticsearch import Elasticsearch, RequestsHttpConnection

from leek.api.conf import settings

from leek.api.ext.base import BaseExtension


class ESExtension(BaseExtension):
    connection = None

    def init_app(self, app):
        app.extensions["es"] = self
        self.connection = Elasticsearch(settings.LEEK_ES_URL)
        print("Connected to elastic search")
        # if settings.ES_CREATE_LIFECYCLE_AFTER_CONNECTION:
        #     create_or_update_default_lifecycle_policy()
        #     print("Index lifecycle created")
