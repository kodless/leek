import logging
import time
from random import choice
from string import ascii_uppercase

from flask import Blueprint, request, g
from flask_restx import Resource

from ..decorators import auth
from ..utils import generate_api_key
from ..schemas.application import ApplicationSchema, TriggerSchema
from ..db import template as apps
from .api_v1 import api_v1

applications_bp = Blueprint('applications', __name__, url_prefix='/this/v1/applications')
applications_ns = api_v1.namespace('applications', 'Manage Leek Applications')

logger = logging.getLogger(__name__)


@applications_ns.route('/')
class Applications(Resource):

    @auth
    def post(self):
        """
        Create application
        """
        data = request.get_json()
        app = ApplicationSchema.validate(data)
        org_name = g.org_name
        template_name = f"{org_name}-{app['app_name']}"

        app["api_key"] = generate_api_key()
        app["created_at"] = int(time.time())
        app["owner"] = g.email

        return apps.create_index_template(
            index_alias=template_name,
            lifecycle_policy_name="default",
            meta=app
        )

    @auth
    def get(self):
        """
        Retrieve organization applications
        """
        org_name = g.org_name
        return apps.get_index_templates(org_name)


@applications_ns.route('/<string:app_name>/fo-triggers')
class AddFanoutTriggers(Resource):

    @auth
    def post(self, app_name):
        """
        Create fanout trigger
        """
        data = request.get_json()
        trigger = TriggerSchema.validate(data)

        org_name = g.org_name
        trigger["id"] = ''.join(choice(ascii_uppercase) for i in range(10))

        return apps.add_or_update_app_fo_trigger(
            index_alias=f"{org_name}-{app_name}",
            trigger=trigger
        )


@applications_ns.route('/<string:app_name>')
class DeleteApplication(Resource):

    @auth
    def delete(self, app_name):
        """
        Delete application
        """
        return apps.delete_application(f"{g.org_name}-{app_name}")


@applications_ns.route('/<string:app_name>/purge')
class PurgeApplication(Resource):

    @auth
    def delete(self, app_name):
        """
        Purge application
        """

        return apps.purge_application(f"{g.org_name}-{app_name}")


@applications_ns.route('/<string:app_name>/indices')
class ApplicationIndices(Resource):

    @auth
    def get(self, app_name):
        """
        List application indices
        """

        return apps.get_application_indices(f"{g.org_name}-{app_name}")


@applications_ns.route('/<string:app_name>/fo-triggers/<string:trigger_id>')
class UpdateFanoutTriggers(Resource):

    @auth
    def put(self, app_name, trigger_id):
        """
        Create fanout trigger
        """
        data = request.get_json()
        trigger = TriggerSchema.validate(data)

        org_name = g.org_name
        trigger["id"] = trigger_id

        return apps.add_or_update_app_fo_trigger(
            index_alias=f"{org_name}-{app_name}",
            trigger=trigger
        )

    @auth
    def delete(self, app_name, trigger_id):
        org_name = g.org_name

        return apps.delete_app_fo_trigger(
            index_alias=f"{org_name}-{app_name}",
            trigger_id=trigger_id
        )
