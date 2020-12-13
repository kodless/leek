from leek.api.ext import cors, es


def init_extensions(app):
    cors.init_app(app)
    es.init_app(app)
