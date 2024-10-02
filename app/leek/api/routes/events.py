import logging
import time

from flask import Blueprint, request, g
from flask_restx import Resource
from elasticsearch import exceptions as es_exceptions

from leek.api.conf import settings
from leek.api.decorators import get_app_context
from leek.api.db.events import merge_events
from leek.api.errors import responses
from leek.api.routes.api_v1 import api_v1
from leek.api.db.template import get_app
from leek.api.db import template as apps

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
        payload = request.get_json()
        if not len(payload):
            logger.warning("Empty payload, nothing to be processed!")
            return {"success": 0}, 201
        result, status = merge_events(g.context["index_alias"], payload)
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

        template_name = f"{org_name}-{app_name}"

        try:
            # Get application
            app = get_app(template_name)
            # Authenticate
            if app_key not in [app["app_key"], settings.LEEK_AGENT_API_SECRET]:
                return responses.wrong_application_app_key
        except es_exceptions.NotFoundError:
            # Create app if not exist, only supported when leek auth is disabled.
            if settings.LEEK_CREATE_APP_IF_NOT_EXIST and not settings.LEEK_API_ENABLE_AUTH:
                logger.warning("LEEK_CREATE_APP_IF_NOT_EXIST was set to true, leek app will be auto-created by agent.")
                app = {
                    "app_name": app_name,
                    "app_description": "auto created app by agent",
                    "fo_triggers": [],
                    "owner": "public",
                    "app_key": settings.LEEK_AGENT_API_SECRET,
                    "created_at": int(round(time.time() * 1000))
                }
                _, status_code = apps.create_index_template(
                    index_alias=template_name,
                    number_of_shards=1,
                    number_of_replicas=0,
                    lifecycle_policy_name="leek-rollover-policy",
                    meta=app
                )
                if status_code == 201:
                    logger.info("leek app auto-created successfully.")
                    return "Ready!", 200
            else:
                return responses.application_not_found
        except es_exceptions.ConnectionError:
            return responses.search_backend_unavailable

        return "Ready!", 200
