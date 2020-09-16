from flask import current_app


class BaseExtension:
    app = None

    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        raise NotImplementedError

    def _get_app(self):
        if not current_app and self.app:
            return self.app
        return current_app
