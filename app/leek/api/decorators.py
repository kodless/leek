from functools import wraps
from typing import List
from elasticsearch import exceptions as es_exceptions

from flask import g, request
from jose import JWTError

from leek.api.db.store import Application, FanoutTrigger
from leek.api.errors import responses
from leek.api.db.template import get_app
from leek.api.conf import settings
from leek.api.auth import decode_jwt_token


def get_claims():
    """
    Validates the auth token and build context
    """
    # Get and Validate Header
    id_token_header = request.headers.get("Authorization")
    if not id_token_header:
        raise JWTError("The endpoint requires a bearer id token")
    if id_token_header.startswith("Bearer"):
        g.id_token = id_token_header.split()[1]
    else:
        g.id_token = id_token_header
    # Authorize
    g.claims = decode_jwt_token(g.id_token)
    build_context()


def build_context():
    g.username = g.claims["sub"]
    if g.claims["email"].endswith("@gmail.com"):
        # Normal user, org_name will be username
        g.org_name = g.claims["email"].split("@")[0]
    else:
        # GSuite user, org_name will be domain.ltd
        g.org_name = g.claims["email"].split("@")[1]
    g.email = g.claims["email"]


def auth(_route=None, allowed_org_names: List = None, only_app_owner=False):
    def decorator(route):
        @wraps(route)
        def wrapper(*args, **kwargs):
            get_claims()
            if len(settings.LEEK_API_WHITELISTED_ORGS) and g.org_name not in settings.LEEK_API_WHITELISTED_ORGS:
                raise JWTError(f'Only {settings.LEEK_API_WHITELISTED_ORGS} are whitelisted to use this app')
            if allowed_org_names:
                if g.org_name not in allowed_org_names:
                    raise JWTError(f'Only {allowed_org_names} org can access this endpoint')
            if only_app_owner:
                try:
                    app_name = request.headers["x-leek-app-name"]
                except KeyError as e:
                    return responses.missing_headers
                try:
                    app = get_app(f"{g.org_name}-{app_name}")
                    if g.email != app.get("owner"):
                        return responses.insufficient_permission
                except es_exceptions.NotFoundError:
                    return responses.application_not_found
                except es_exceptions.ConnectionError:
                    return responses.cache_backend_unavailable

            return route(*args, **kwargs)

        return wrapper

    if _route:
        return decorator(_route)
    return decorator


def get_app_context(_route=None):
    def decorator(route):
        @wraps(route)
        def wrapper(*args, **kwargs):
            # Get headers
            try:
                org_name = request.headers["x-leek-org-name"]
                app_name = request.headers["x-leek-app-name"]
                app_env = request.headers["x-leek-app-env"]
                app_key = request.headers["x-leek-app-key"]
            except KeyError as e:
                return responses.missing_headers

            # Get app
            try:
                # Get/Build application
                app = get_app(f"{org_name}-{app_name}")
                fo_triggers = app.pop("fo_triggers")
                triggers = [FanoutTrigger(**t) for t in fo_triggers]
                application = Application(**app, fo_triggers=triggers)
                # Authenticate
                if app_key not in [application.app_key, settings.LEEK_AGENT_API_SECRET]:
                    return responses.wrong_application_app_key
            except es_exceptions.NotFoundError:
                return responses.application_not_found
            except es_exceptions.ConnectionError:
                return responses.cache_backend_unavailable

            # Build context
            g.context = {
                "index_alias": f"{org_name}-{app_name}",
                "app": application,
                "org_name": org_name,
                "app_name": app_name,
                "app_env": app_env,
                "app_key": app_key,
            }
            return route(*args, **kwargs)

        return wrapper

    if _route:
        return decorator(_route)
    return decorator
