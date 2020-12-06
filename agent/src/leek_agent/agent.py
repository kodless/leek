import json
import os
import ast

import gevent

from .logger import get_logger
from .consumer import LeekConsumer

logger = get_logger(__name__)


class LeekAgent:
    """Main server object, which:
        - Load subscriptions from config file.
        - Orchestrates capturing of celery events.
        - Fanout to API webhooks endpoints
    """

    def __init__(self):
        self.consumers = []
        self.subscriptions = self.load_subscriptions()

        logger.info("Building consumers...")
        for subscription_name, subscription_config in self.subscriptions.items():
            consumer = LeekConsumer(subscription_name, **subscription_config)
            self.consumers.append(consumer)
        logger.info("Consumers built...")

    def start(self):
        logger.info("Starting Leek Agent...")
        gs = []
        for consumer in self.consumers:
            gs.append(gevent.spawn(consumer.run()))

        gevent.joinall(gs)
        logger.info("Leek Agent stopped!")

    @staticmethod
    def load_subscriptions():
        logger.info(f"Loading subscriptions...")

        # FROM JSON ENV VAR
        subscriptions = os.environ.get("LEEK_SUBSCRIPTIONS")
        if subscriptions:
            subscriptions = ast.literal_eval(subscriptions)

        # FROM JSON FILE
        if not subscriptions:
            subscriptions_file = os.environ.get("LEEK_SUBSCRIPTIONS_FILE_PATH")
            if not subscriptions_file:
                subscriptions_file = "/opt/agent/config/subscriptions.json"
                logger.warning(f"LEEK_SUBSCRIPTIONS_FILE_PATH environment variable is not set, "
                               F"Using default subscriptions file in {subscriptions_file}.")
            with open(subscriptions_file) as json_file:
                subscriptions = json.load(json_file)

        logger.info(f"Found {len(subscriptions)} subscriptions!")
        return subscriptions
