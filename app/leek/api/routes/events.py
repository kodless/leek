import logging
import time

from flask import Blueprint, request, g
from flask_restx import Resource
from elasticsearch import exceptions as es_exceptions

from leek.api.channels.pipeline import notify
from leek.api.conf import settings
from leek.api.decorators import get_app_context
from leek.api.db.events import merge_events
from leek.api.errors import responses
from leek.api.schemas.serializer import validate_payload
from leek.api.routes.api_v1 import api_v1
from leek.api.db.template import get_app

events_bp = Blueprint('events', __name__, url_prefix='/v1/events')
events_ns = api_v1.namespace('events', 'Agents events handler')

logger = logging.getLogger(__name__)


@events_ns.route('/process')
class ProcessEvents(Resource):

    @get_app_context
    def post(self):
        """
        Process agent events
        """
        # TODO: API Key validation should be moved to API Gateway
        start_time = time.time()
        payload = request.get_json()
        env = g.context["app_env"]
        if not len(payload):
            return "Nothing to be processed", 200
        events = validate_payload(payload, env)
        result, status = merge_events(g.context["index_alias"], events)
        # print("--- Store %s seconds ---" % (time.time() - start_time))
        if status == 201:
            notify(g.context["app"], env, result)
            return "Processed", status
        return result, status

    def get(self):
        """
        Check if application is ready to receive events
        """
        try:
            org_name = request.headers["x-leek-org-name"]
            app_name = request.headers["x-leek-app-name"]
            app_key = request.headers["x-leek-app-key"]
        except KeyError as e:
            return responses.missing_headers

        try:
            # Get application
            app = get_app(f"{org_name}-{app_name}")
            # Authenticate
            if app_key not in [app["app_key"], settings.LEEK_AGENT_API_SECRET]:
                return responses.wrong_application_app_key
        except es_exceptions.NotFoundError:
            return responses.application_not_found
        except es_exceptions.ConnectionError:
            return responses.search_backend_unavailable

        return "Ready!", 200
