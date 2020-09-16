import logging

from flask import Blueprint, request, g
from flask_restx import Resource

from ..channels import notify
from ..decorators import get_app_context
from ..db.events import upsert_payload
from ..schemas import validate_payload
from .api_v1 import api_v1

events_bp = Blueprint('events', __name__, url_prefix='/v1/events')
events_ns = api_v1.namespace('events', 'RabbitMQ Webhooks events handler.')

logger = logging.getLogger(__name__)


@events_ns.route('/process')
class ProcessEvents(Resource):

    @get_app_context
    def post(self):
        """
        Process rabbitmq webhooks events
        """
        # TODO: API Key validation should be moved to API Gateway
        payload = request.get_json()
        events = validate_payload(payload)
        result, status = upsert_payload(g.context["index_alias"], events, g.context["app_env"])
        if status == 201:
            notify(g.context["app"], g.context["app_env"], result)
            return "Processed", status
        return result, status
