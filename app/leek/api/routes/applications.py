import logging
import time
from random import choice
from string import ascii_uppercase

from flask import Blueprint, request, g
from flask_restx import Resource
from schema import SchemaError

from leek.api.decorators import auth
from leek.api.utils import generate_app_key, init_trigger
from leek.api.schemas.application import ApplicationSchema, TriggerSchema
from leek.api.db import template as apps
from leek.api.routes.api_v1 import api_v1

applications_bp = Blueprint('applications', __name__, url_prefix='/v1/applications')
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

        app["app_key"] = generate_app_key()
        app["created_at"] = int(round(time.time() * 1000))
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

    @auth(only_owner=True)
    def post(self, app_name):
        """
        Create fanout trigger
        """
        data = request.get_json()
        trigger = TriggerSchema.validate(data)
        trigger["id"] = ''.join(choice(ascii_uppercase) for i in range(10))

        if not init_trigger(trigger, app_name):
            raise SchemaError(f"Invalid webhook URL")

        org_name = g.org_name

        return apps.add_or_update_app_fo_trigger(
            index_alias=f"{org_name}-{app_name}",
            trigger=trigger
        )


@applications_ns.route('/<string:app_name>')
class DeleteApplication(Resource):

    @auth(only_owner=True)
    def delete(self, app_name):
        """
        Delete application
        """
        return apps.delete_application(f"{g.org_name}-{app_name}")


@applications_ns.route('/<string:app_name>/purge')
class PurgeApplication(Resource):

    @auth(only_owner=True)
    def delete(self, app_name):
        """
        Purge application
        """

        return apps.purge_application(f"{g.org_name}-{app_name}")


@applications_ns.route('/<string:app_name>/clean')
class CleanApplication(Resource):

    @auth(only_owner=True)
    def delete(self, app_name):
        """
        Clean application
        """
        data = request.args.to_dict()
        return apps.clean_documents_older_than(
            f"{g.org_name}-{app_name}",
            kind=data["kind"],
            count=data["count"],
            unit=data["unit"]
        )


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

    @auth(only_owner=True)
    def put(self, app_name, trigger_id):
        """
        Edit fanout trigger
        """
        data = request.get_json()
        trigger = TriggerSchema.validate(data)
        trigger["id"] = trigger_id

        if not init_trigger(trigger, app_name):
            raise SchemaError(f"Invalid webhook URL")

        org_name = g.org_name

        return apps.add_or_update_app_fo_trigger(
            index_alias=f"{org_name}-{app_name}",
            trigger=trigger
        )

    @auth(only_owner=True)
    def delete(self, app_name, trigger_id):
        org_name = g.org_name

        return apps.delete_app_fo_trigger(
            index_alias=f"{org_name}-{app_name}",
            trigger_id=trigger_id
        )
