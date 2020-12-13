import logging
import os

logging.basicConfig(level=os.environ.get('LEEK_AGENT_LOG_LEVEL', 'INFO'), format="%(levelname)s:%(name)s:%(message)s")


# TODO: Add logs formatter
def get_logger(name):
    return logging.getLogger(name)
