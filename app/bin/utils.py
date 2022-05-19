import logging
import os
import signal
import sys

logging.basicConfig(level="INFO", format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


def abort(msg):
    logger.error(msg)
    os.kill(1, signal.SIGTERM)
    sys.exit(1)
