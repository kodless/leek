import logging
import gevent
import time

from flask import Blueprint, request, g
from flask_restx import Resource

from leek.api.channels import notify
from leek.api.decorators import get_app_context
from leek.api.db.events import merge_events
from leek.api.schemas.serializer import validate_payload
from leek.api.routes.api_v1 import api_v1

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
        start_time = time.time()
        payload = request.get_json()
        env = g.context["app_env"]
        if not len(payload):
            return "Nothing to be processed", 200
        events = validate_payload(payload, env)
        result, status = merge_events(g.context["index_alias"], events)
        print("--- Store %s seconds ---" % (time.time() - start_time))
        if status == 201:
            notify(g.context["app"], env, result)
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
        from leek.agent.agent import LeekAgent

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
