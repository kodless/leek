import logging
import os

import gevent


class Adapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        try:
            greenlet_name = gevent.getcurrent().name
        except AttributeError:
            greenlet_name = "main"
        msg = '(%s) %s' % (greenlet_name, msg)
        return msg, kwargs


logging.basicConfig(level=os.environ.get('LEEK_AGENT_LOG_LEVEL', 'INFO'), format="%(levelname)s:%(name)s:%(message)s")


# TODO: Add logs formatter
def get_logger(name):
    return Adapter(logging.getLogger(name), {})
