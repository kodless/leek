import json
import logging
import tempfile
from datetime import datetime

from flask import Blueprint, g, request, send_file
from flask_restx import Resource
from elasticsearch import exceptions as es_exceptions

from leek.api.decorators import auth
from leek.api.routes.api_v1 import api_v1
from leek.api.errors import responses
from leek.api.backup.export import export_by_query

backup_bp = Blueprint('backup', __name__, url_prefix='/v1/backup')
backup_ns = api_v1.namespace('backup', 'Leek backup')

logger = logging.getLogger(__name__)


@backup_ns.route('/export')
class Export(Resource):

    @auth
    def post(self):
        """
        Export by query
        """
        data = request.get_json()
        query = data["query"]
        try:
            file_name = f"leek-{datetime.now().strftime('%b-%d-%YT%H-%M-%S').lower()}.json"
            docs = export_by_query(g.index_alias, query)
            content = {
                "index": g.index_alias,
                "query": query,
                "count": len(docs),
                "result": docs
            }
            with tempfile.NamedTemporaryFile(suffix='.json') as tmp:
                with open(tmp.name, "w") as file_object:
                    json.dump(content, file_object, indent=2)
                return send_file(
                    str(tmp.name),
                    download_name=file_name,
                    as_attachment=True,
                    mimetype="application/json"
                )
        except es_exceptions.ConnectionError:
            return responses.search_backend_unavailable
        except es_exceptions.NotFoundError:
            return responses.application_not_found
