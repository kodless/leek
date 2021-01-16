import json
import logging

from xmlrpc.client import ServerProxy
import supervisor.xmlrpc
from flask import Blueprint, request, g
from flask_restx import Resource
from kombu.connection import Connection

from leek.api.schemas.subscription import SubscriptionSchema
from leek.api.conf import settings
from leek.api.decorators import auth
from leek.api.routes.api_v1 import api_v1
from leek.api.errors import responses

agent_bp = Blueprint('agent', __name__, url_prefix='/v1/agent')
agent_ns = api_v1.namespace('agent', 'Agent manager')

logger = logging.getLogger(__name__)
SUBSCRIPTIONS_FILE = "/opt/app/conf/subscriptions.json"

"""
This is only supported for Local Agent. 
If you don't have access to brokers infrastructure consider using the Standalone Agent
"""


@agent_ns.route('/control')
class AgentControl(Resource):
    """
    Control agent process
    """

    server = ServerProxy('http://localhost:9001/RPC2',
                         transport=supervisor.xmlrpc.SupervisorTransport(
                             None, None, serverurl="unix:///var/run/supervisor.sock"))

    @auth(allowed_org_names=[settings.LEEK_API_OWNER_ORG])
    def get(self):
        """
        Retrieve agent status
        """
        return self.server.supervisor.getProcessInfo("agent"), 200

    @auth(allowed_org_names=[settings.LEEK_API_OWNER_ORG])
    def post(self):
        """
        Start/Restart agent
        """
        # Check if there are subscriptions
        with open(SUBSCRIPTIONS_FILE) as s:
            subscriptions = json.load(s)
        if not len(subscriptions):
            return responses.no_subscriptions_found
        # -- Start or Restart
        agent = self.server.supervisor.getProcessInfo("agent")
        if agent["statename"] == "RUNNING":
            self.server.supervisor.stopProcess("agent")
        self.server.supervisor.startProcess("agent")
        return self.server.supervisor.getProcessInfo("agent"), 200

    @auth(allowed_org_names=[settings.LEEK_API_OWNER_ORG])
    def delete(self):
        """
        Stop leek agent
        """
        self.server.supervisor.stopProcess("agent")
        return self.server.supervisor.getProcessInfo("agent"), 200


@agent_ns.route('/subscriptions')
class AgentSubscriptionsList(Resource):

    @auth
    def get(self):
        """
        Get subscriptions
        """
        app_name = request.headers["x-leek-app-name"]
        with open(SUBSCRIPTIONS_FILE) as s:
            subscriptions = json.load(s)
        app_subscriptions = [
            {
                "name": subscription_name, **subscription,
                "broker": Connection(subscription.get("broker")).as_uri(),
                "backend": Connection(subscription.get("backend")).as_uri() if subscription.get("backend") else None
            } for subscription_name, subscription in
            subscriptions.items() if
            subscription.get("app_name") == app_name and subscription.get("org_name") == g.org_name]
        return app_subscriptions, 200

    @auth(only_app_owner=True)
    def post(self):
        """
        Add subscription
        """
        data = request.get_json()
        app_name = request.headers["x-leek-app-name"]
        subscription = SubscriptionSchema.validate(data)

        subscription.update({
            "org_name": g.org_name,
            "app_name": app_name,
            "app_key": settings.LEEK_AGENT_API_SECRET,
            "api_url": settings.LEEK_API_URL
        })
        # Ensure connection
        try:
            connection = Connection(subscription["broker"], virtual_host=subscription["virtual_host"])
            connection.ensure_connection(max_retries=2)
            connection.release()
        except:
            return responses.broker_not_reachable
        # Add subscription
        # ...
        return subscription, 200


@agent_ns.route('/subscriptions/<string:subscription_name>')
class AgentSubscription(Resource):

    @auth(only_app_owner=True)
    def put(self, subscription_name):
        """
        Edit subscription
        """
        pass

    @auth(only_app_owner=True)
    def delete(self, subscription_name):
        """
        Delete subscription
        """
        with open(SUBSCRIPTIONS_FILE) as s:
            subscriptions = json.load(s)

        subscriptions.pop(subscription_name)

        with open(SUBSCRIPTIONS_FILE, 'w') as f:
            json.dump(subscriptions, f, indent=4, sort_keys=False)

        return "Deleted", 200
