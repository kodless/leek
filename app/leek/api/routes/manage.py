import logging

from flask import Blueprint, current_app, url_for
from flask_restx import Resource

from leek.api.conf import settings
from leek.api.db.policy import create_or_update_default_lifecycle_policy
from leek.api.routes.api_v1 import api_v1
from leek.api.decorators import auth

manage_bp = Blueprint('manage', __name__, url_prefix='/v1/manage')
manage_ns = api_v1.namespace('manage', 'Operations related to management.')

logger = logging.getLogger(__name__)


###############################################
#                 Health Check                |
#  Can be called from ttt to avoid cold start |
###############################################
@manage_ns.route('/hc')
class HealthCheck(Resource):

    def get(self):
        """
        Useful to prevent cold start, should be called periodically by another lambda
        """
        return {"status": "I'm sexy and i know it"}, 200


def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)


@manage_ns.route('/site-map')
class ListSiteMap(Resource):

    @auth(allowed_org_names=[settings.LEEK_API_OWNER_ORG])
    def get(self):
        """
        Get flask app available urls
        """
        links = []
        for rule in current_app.url_map.iter_rules():
            # Filter out rules we can't navigate to in a browser
            # and rules that require parameters
            if "GET" in rule.methods and has_no_empty_params(rule):
                url = url_for(rule.endpoint, **(rule.defaults or {}))
                links.append((url, rule.endpoint))
        return {"links": links}, 200


@manage_ns.route('/lifecycle')
class IndexLifecycle(Resource):

    # @auth(allowed_org_names=[settings.LEEK_API_OWNER_ORG])
    def put(self):
        """
        Update default index lifecycle
        """
        return create_or_update_default_lifecycle_policy()
