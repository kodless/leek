import logging

from flask import Blueprint, g, request
from flask_restx import Resource

from leek.api.control.stats import get_fanout_queue_drift, get_subscription_queues, purge_queue
from leek.api.decorators import auth
from leek.api.routes.api_v1 import api_v1

broker_bp = Blueprint('broker', __name__, url_prefix='/v1/broker')
broker_ns = api_v1.namespace('broker', 'Broker operations.')

logger = logging.getLogger(__name__)


@broker_ns.route('/drift')
class Drift(Resource):

    @auth
    def get(self):
        """
        Get search drift
        """
        return get_fanout_queue_drift(g.index_alias, g.app_name, g.app_env)


@broker_ns.route('/queues')
class Queues(Resource):

    @auth
    def get(self):
        """
        List subscription queues
        """
        params = request.args.to_dict()
        return get_subscription_queues(
            g.app_name,
            g.app_env,
            hide_pid_boxes=params["hide_pid_boxes"]
        )


@broker_ns.route('/queue/<string:queue_name>/purge')
class PurgeQueue(Resource):

    @auth(only_app_owner=True)
    def delete(self, queue_name):
        """
        Purge a specific queue
        """
        return purge_queue(
            g.app_name,
            g.app_env,
            queue_name
        )
