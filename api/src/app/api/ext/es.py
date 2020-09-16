import boto3
from elasticsearch import Elasticsearch, exceptions as es_exceptions, RequestsHttpConnection

from ..conf import settings

from .base import BaseExtension


class ESExtension(BaseExtension):
    connection = None

    def init_app(self, app):
        app.extensions["es"] = self
        if settings.ENV in ["DEV", "TEST"]:
            self.connection = Elasticsearch(settings.ES_DOMAIN_URL)
        else:
            from requests_aws4auth import AWS4Auth
            region = settings.AWS_REGION
            service = "es"
            credentials = boto3.Session().get_credentials()
            aws_auth = AWS4Auth(
                credentials.access_key,
                credentials.secret_key,
                region,
                service,
                session_token=credentials.token
            )
            self.connection = Elasticsearch(
                hosts=settings.ES_DOMAIN_URL,
                http_auth=aws_auth,
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection,
            )
        print("Connected to elastic search")
        # if settings.ES_CREATE_LIFECYCLE_AFTER_CONNECTION:
        #     create_or_update_default_lifecycle_policy()
        #     print("Index lifecycle created")
