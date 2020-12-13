import logging

from flask import Blueprint, g
from flask_restx import Resource

from leek.api.routes.api_v1 import api_v1
from leek.api.decorators import auth

users_bp = Blueprint('users', __name__, url_prefix='/v1/users')
users_ns = api_v1.namespace('users', 'Operations related to users.')

logger = logging.getLogger(__name__)


@users_ns.route('/whoami')
class WhoAmI(Resource):

    @auth
    def get(self):
        """
        Useful to prevent cold start, should be called periodically by another lambda
        """
        return {"claims": g.claims}, 200
