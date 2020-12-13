from flask import Blueprint
from flask_restx import Api

from leek.api.errors.errors_handler import handle_errors

api_v1_blueprint = Blueprint('api', __name__, url_prefix=f'/v1')

api_v1 = Api(api_v1_blueprint,
             version='1.0',
             title='Demo Rest API',
             description='A demo is worth thousand words',
             doc='/docs')


handle_errors(api_v1)
