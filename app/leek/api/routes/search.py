import logging

from flask import Blueprint, request, g
from flask_restx import Resource

from leek.api.decorators import auth
from leek.api.schemas.search_params import SearchParamsSchema
from leek.api.db.search import search_index
from leek.api.routes.api_v1 import api_v1

search_bp = Blueprint('search', __name__, url_prefix='/v1/search')
search_ns = api_v1.namespace('search', 'Search index.')

logger = logging.getLogger(__name__)


@search_ns.route('/')
class Search(Resource):

    @auth
    def post(self):
        """
        Search index
        """
        query = request.get_json()
        params = SearchParamsSchema.validate(request.args.to_dict())
        return search_index(g.index_alias, query, params)
