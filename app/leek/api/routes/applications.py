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

        if hasattr(g, "email"):
            app["owner"] = g.email
        else:
            app["owner"] = "public"

        template_name = f"{g.org_name}-{app['app_name']}"
        app["app_key"] = generate_app_key()
        app["created_at"] = int(round(time.time() * 1000))

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
        return apps.get_index_templates(g.org_name)

    @auth(only_app_owner=True)
    def delete(self):
        """
        Delete application
        """
        return apps.delete_application(g.index_alias)


@applications_ns.route('/purge')
class PurgeApplication(Resource):

    @auth(only_app_owner=True)
    def delete(self):
        """
        Purge application
        """

        return apps.purge_application(g.index_alias)


@applications_ns.route('/clean')
class CleanApplication(Resource):

    @auth(only_app_owner=True)
    def delete(self):
        """
        Clean application
        """
        data = request.args.to_dict()
        return apps.clean_documents_older_than(
            g.index_alias,
            kind=data["kind"],
            count=data["count"],
            unit=data["unit"]
        )


@applications_ns.route('/indices')
class ApplicationIndices(Resource):

    @auth
    def get(self):
        """
        List application indices
        """

        return apps.get_application_indices(g.index_alias)


@applications_ns.route('/fo-triggers')
class AddFanoutTriggers(Resource):

    @auth(only_app_owner=True)
    def post(self):
        """
        Create fanout trigger
        """
        data = request.get_json()
        trigger = TriggerSchema.validate(data)
        trigger["id"] = ''.join(choice(ascii_uppercase) for i in range(10))

        if not init_trigger(trigger, g.app_name):
            raise SchemaError(f"Invalid webhook URL")

        return apps.add_or_update_app_fo_trigger(
            index_alias=g.index_alias,
            trigger=trigger
        )


@applications_ns.route('/fo-triggers/<string:trigger_id>')
class UpdateFanoutTriggers(Resource):

    @auth(only_app_owner=True)
    def put(self, trigger_id):
        """
        Edit fanout trigger
        """
        data = request.get_json()
        trigger = TriggerSchema.validate(data)
        trigger["id"] = trigger_id

        if not init_trigger(trigger, g.app_name):
            raise SchemaError(f"Invalid webhook URL")

        return apps.add_or_update_app_fo_trigger(
            index_alias=g.index_alias,
            trigger=trigger
        )

    @auth(only_app_owner=True)
    def delete(self, trigger_id):
        return apps.delete_app_fo_trigger(
            index_alias=g.index_alias,
            trigger_id=trigger_id
        )
