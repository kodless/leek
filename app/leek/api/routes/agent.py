import logging

from xmlrpc.client import ServerProxy
import supervisor.xmlrpc
from flask import Blueprint
from flask_restx import Resource

from leek.api.conf import settings
from leek.api.decorators import auth
from leek.api.routes.api_v1 import api_v1

agent_bp = Blueprint('agent', __name__, url_prefix='/v1/agent')
agent_ns = api_v1.namespace('agent', 'Agent manager')

logger = logging.getLogger(__name__)

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

    @auth(only_app_owner=True)
    def get(self):
        """
        Get subscriptions
        """
        pass

    @auth(only_app_owner=True)
    def post(self):
        """
        Add subscription
        """
        pass


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
        pass
