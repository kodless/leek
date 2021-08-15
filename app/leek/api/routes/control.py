import logging

from flask import Blueprint, g, request
from flask_restx import Resource
from elasticsearch import exceptions as es_exceptions

from leek.api.db.store import STATES_TERMINAL
from leek.api.decorators import auth
from leek.api.db import search
from leek.api.routes.api_v1 import api_v1
from leek.api.control import task
from leek.api.errors import responses
from leek.api.schemas.control import RevocationSchema

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
        try:
            task_doc = search.get_task_by_uuid(
                index_alias=g.index_alias,
                task_uuid=task_uuid
            )
            return task.retry_task(g.app_name, task_doc["_source"])
        except es_exceptions.ConnectionError:
            return responses.search_backend_unavailable
        except es_exceptions.NotFoundError:
            return responses.application_not_found


@control_ns.route('/tasks/<string:task_uuid>/revoke-by-id')
class RevokeTaskByID(Resource):

    @auth
    def post(self, task_uuid):
        """
        Revoke a celery task
        """
        try:
            args = request.get_json()
            args = RevocationSchema.validate(args)
            task_doc = search.get_task_by_uuid(
                index_alias=g.index_alias,
                task_uuid=task_uuid
            )
            t = task_doc["_source"]
            # Check if task is revocable
            if t.get("state") in STATES_TERMINAL:
                return responses.task_revoke_state_precondition_failed
            # Send revocation command
            return task.revoke(g.app_name, t["app_env"], t["uuid"], args)
        except es_exceptions.ConnectionError:
            return responses.search_backend_unavailable
        except es_exceptions.NotFoundError:
            return responses.application_not_found


@control_ns.route('/tasks/<string:task_name>/revoke-by-name')
class RevokeTaskByName(Resource):

    @auth
    def post(self, task_name):
        """
        Revoke a celery task
        """
        try:
            args = request.get_json()
            args = RevocationSchema.validate(args)
            revocable_tasks = search.get_revocable_tasks_by_name(
                index_alias=g.index_alias,
                app_env=g.app_env,
                task_name=task_name
            )
            # No revocable task found
            if not len(revocable_tasks):
                return responses.task_revoke_state_precondition_failed

            # Dry run
            params = request.args.to_dict()
            if params.get("dry_run") == "true":
                return {"revocation_count": len(revocable_tasks)}

            # Send revocation command
            return task.revoke(g.app_name, g.app_env, revocable_tasks, args)
        except es_exceptions.ConnectionError:
            return responses.search_backend_unavailable
        except es_exceptions.NotFoundError:
            return responses.application_not_found
