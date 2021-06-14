import logging

from flask import Blueprint, request, g
from flask_restx import Resource
from elasticsearch import exceptions as es_exceptions

from leek.api.decorators import auth
from leek.api.db import search
from leek.api.routes.api_v1 import api_v1
from leek.api.control import task
from leek.api.errors import responses

control_bp = Blueprint('control', __name__, url_prefix='/v1/control')
control_ns = api_v1.namespace('control', 'Celery controlLer')

logger = logging.getLogger(__name__)


@control_ns.route('/tasks/<string:task_uuid>/retry')
class TaskRetry(Resource):

    @auth
    def post(self, task_uuid):
        """
        Retry a celery task
        """
        app_name = request.headers["x-leek-app-name"]
        org_name = g.org_name
        index_alias = f"{org_name}-{app_name}"
        try:
            task_doc = search.get_task_by_uuid(
                index_alias=index_alias,
                task_uuid=task_uuid
            )
            return task.retry_task(app_name, task_doc["_source"])
        except es_exceptions.ConnectionError:
            return responses.cache_backend_unavailable
        except es_exceptions.NotFoundError:
            return responses.application_not_found

