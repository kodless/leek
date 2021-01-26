import json

from signal import signal, SIGTERM
from multiprocessing import Process

from leek.agent.logger import get_logger
from leek.agent.consumer import LeekConsumer

logger = get_logger(__name__)


class LeekAgent:
    """Main server object, which:
        - Load subscriptions from config file.
        - Orchestrates capturing of celery events.
        - Fanout to API webhooks endpoints
    """

    def __init__(self):
        self.consumers = []
        self.proc = []
        self.subscriptions = self.load_subscriptions()
        self.loop = None

        if not len(self.subscriptions):
            logger.warning("No subscriptions found, Consider adding subscriptions through environment variable or UI.")
            return

        logger.info("Building consumers...")
        for subscription_name, subscription_config in self.subscriptions.items():
            consumer = LeekConsumer(subscription_name, **subscription_config)
            self.consumers.append(consumer)
        logger.info("Consumers built...")

    @staticmethod
    def load_subscriptions():
        logger.info(f"Loading subscriptions...")

        # FROM JSON FILE
        subscriptions_file = "/opt/app/conf/subscriptions.json"
        with open(subscriptions_file) as json_file:
            subscriptions = json.load(json_file)

        logger.info(f"Found {len(subscriptions)} subscriptions!")
        return subscriptions

    def start(self):
        if not len(self.consumers):
            return

        logger.info("Starting Leek Agent...")

        signal(SIGTERM, self.stop)
        for consumer in self.consumers:
            p = Process(target=consumer.run)
            p.start()
            self.proc.append(p)

        for p in self.proc:
            p.join()

        logger.info("Leek Agent stopped!")

    def stop(self, _signal_received, _frame):
        # Handle any cleanup here
        print("SIGTERM detected. Exiting gracefully")
        for p in self.proc:
            p.kill()


if __name__ == '__main__':
    LeekAgent().start()
