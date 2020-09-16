# -*- coding: utf-8 -*-

import base64
import sys

try:
    from urllib import urlencode
except ImportError:
    from urllib.parse import urlencode

from flask import Flask

from werkzeug._compat import BytesIO, string_types, to_bytes, wsgi_encoding_dance
from werkzeug.wrappers import BaseRequest

__version__ = '0.0.4'


def make_environ(event):
    environ = {'SCRIPT_NAME': ''}

    context = event['requestContext']
    http = context['http']

    # Construct HEADERS
    for hdr_name, hdr_value in event['headers'].items():
        hdr_name = hdr_name.replace('-', '_').upper()
        if hdr_name in ['CONTENT_TYPE', 'CONTENT_LENGTH']:
            environ[hdr_name] = hdr_value
            continue

        http_hdr_name = 'HTTP_%s' % hdr_name
        environ[http_hdr_name] = hdr_value

    # Construct QUERY Params
    qs = event.get('queryStringParameters')
    environ['QUERY_STRING'] = urlencode(qs) if qs else ''

    # Construct HTTP
    environ['REQUEST_METHOD'] = http['method']
    environ['PATH_INFO'] = http['path']
    environ['SERVER_PROTOCOL'] = http['protocol']
    environ['REMOTE_ADDR'] = http['sourceIp']
    environ['HOST'] = '%(HTTP_HOST)s:%(HTTP_X_FORWARDED_PORT)s' % environ
    environ['SERVER_PORT'] = environ['HTTP_X_FORWARDED_PORT']
    environ['wsgi.url_scheme'] = environ['HTTP_X_FORWARDED_PROTO']

    # Authorizer
    environ['AUTHORIZER'] = context.get('authorizer')
    environ['IDENTITY'] = context.get('identity')

    # Body
    body = event.get(u"body", "")
    if event.get("isBase64Encoded", False):
        body = base64.b64decode(body)
    if isinstance(body, string_types):
        body = to_bytes(body, charset="utf-8")
    environ['CONTENT_LENGTH'] = str(len(body))

    # WSGI
    environ['wsgi.input'] = BytesIO(body)
    environ['wsgi.version'] = (1, 0)
    environ['wsgi.errors'] = sys.stderr
    environ['wsgi.multithread'] = False
    environ['wsgi.run_once'] = True
    environ['wsgi.multiprocess'] = False

    BaseRequest(environ)

    return environ


class LambdaResponse(object):
    def __init__(self):
        self.status = None
        self.response_headers = None

    def start_response(self, status, response_headers, exc_info=None):
        self.status = int(status[:3])
        self.response_headers = dict(response_headers)


class FlaskLambda(Flask):

    def __call__(self, event, context):
        if 'requestContext' not in event:
            # In this "context" `event` is `environ` and
            # `context` is `start_response`, meaning the request didn't
            # occur via API Gateway and Lambda
            return super(FlaskLambda, self).__call__(event, context)

        print(event)
        response = LambdaResponse()
        body = next(self.wsgi_app(
            make_environ(event),
            response.start_response
        ))
        res = {
            'statusCode': response.status,
            'headers': response.response_headers,
            'body': body.decode("utf-8")
        }
        return res
