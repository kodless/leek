import logging
import gevent

from flask import Blueprint, request, g
from flask_restx import Resource

from leek.leek_api.channels import notify
from leek.leek_api.decorators import get_app_context
from leek.leek_api.db.events import upsert_payload
from leek.leek_api.schemas import validate_payload
from leek.leek_api.routes.api_v1 import api_v1

events_bp = Blueprint('events', __name__, url_prefix='/v1/events')
events_ns = api_v1.namespace('events', 'RabbitMQ Webhooks events handler')

logger = logging.getLogger(__name__)

# Store agent GEvent GreenLets.
# If the list is empty, the agent has been started stopped.
# If the list is full, the agent has been already started.
AGENT_GS_STORAGE = []


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


@events_ns.route('/start-builtin-agent')
class StartAgent(Resource):

    """
    If you don't have access to brokers infrastructure consider using the standalone agent
    """

    def get(self):
        """
        Retrieve agent status
        """
        return

    def post(self):
        """
        Start leek builtin agent
        """
        from leek.leek_agent.agent import LeekAgent

        if not len(AGENT_GS_STORAGE):
            gs = LeekAgent().start(wait=False)
            AGENT_GS_STORAGE.append(**gs)
            return "Started", 200
        else:
            return "Agent already started", 200

    def delete(self):
        """
        Start leek builtin agent
        """
        gevent.killall(AGENT_GS_STORAGE)
        AGENT_GS_STORAGE.clear()
        return "Stopped", 200
