from __future__ import print_function

import logging

from flask import Flask

from leek.api.extensions import init_extensions
from leek.api.blueprints import register_blueprints
from leek.api.conf import settings

logging.basicConfig(level=settings.LEEK_API_LOG_LEVEL)


def create_app():
    app = Flask(__name__)
    init_extensions(app)
    app.url_map.strict_slashes = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    register_blueprints(app)
    return app
