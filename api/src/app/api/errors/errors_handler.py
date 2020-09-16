import logging

from jose import JWTError
from schema import SchemaError

logger = logging.getLogger(__name__)


def handle_errors(api):
    # Custom exceptions
    # ----------------

    @api.errorhandler(SchemaError)
    def handle_schema_exception(error):
        return {
                   'error': {
                       'code': '400002',
                       'title': 'Schema Validation Error',
                       'message': 'One or more incorrect fields',
                       'reason': str(error),
                   }
               }, 400

    @api.errorhandler(JWTError)
    def handle_jwt_exception(error):
        return {
                   'error': {
                       'code': '401001',
                       'title': 'Unauthorized',
                       'message': 'Access Unauthorized!',
                       'reason': str(error),
                   }
               }, 401

    ########
    # Keep `Exception handler` at the end of the file as it's too broad
    ########
    @api.errorhandler(Exception)
    def handle_exception(error):
        return {
                   'error': {
                       'code': '001500',
                       'title': 'Internal error',
                       'message': 'Oops, something went wrong!',
                       'reason': str(error),
                   }
               }, 500
