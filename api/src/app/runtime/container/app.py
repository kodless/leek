from __future__ import print_function

from flask import Flask

from ...api.extensions import init_extensions
from ...api.blueprints import register_blueprints


def create_app():
    app = Flask(__name__)
    init_extensions(app)
    app.url_map.strict_slashes = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    register_blueprints(app)
    return app
