import time
from urllib.parse import urljoin

import gevent
from gevent.pool import Pool
import requests
from requests import adapters
from kombu.mixins import ConsumerMixin
from kombu import Exchange, Queue, Connection

from leek.agent.logger import get_logger

logger = get_logger(__name__)


class LeekConsumer(ConsumerMixin):
    SUCCESS_STATUS_CODES = [200, 201]
    BACKOFF_STATUS_CODES = [400, 404, 503]
    BACKOFF_DELAY_S = 5
    LEEK_WEBHOOKS_ENDPOINT = "/v1/events/process"

    def __init__(
            self,
            subscription_name,
            # API
            api_url: str = "http://api:5000",
            org_name: str = "leek",
            app_name: str = "leek",
            app_key: str = "secret",
            app_env: str = "qa",
            # BROKER
            broker: str = "amqp://guest:guest@localhost//",
            backend: str = None,
            exchange: str = "celeryev",
            queue: str = "leek.fanout",
            routing_key: str = "#",
            prefetch_count: int = 1000,
            concurrency_pool_size: int = 1
    ):
        """
        :param api_url: The URL of the API where to fanout events
        :param org_name: Leek org name, GMail username for standard users and domain name for GSuite users
        :param app_name: Leek app name, chosen when creating application
        :param app_key: Leek app key, provided after the application has been created
        :param app_env: Leek app env, broker messages env name
        :param broker: Broker url
        :param exchange: Exchange name, should be the same as workers event exchange
        :param queue: Queue name
        :param routing_key: Routing key
        """

        # API
        self.subscription_name = subscription_name
        self.prefetch_count = prefetch_count
        self.concurrency_pool_size = concurrency_pool_size
        self._pool = Pool(concurrency_pool_size)
        logger.info(f"Building consumer "
                    f"[Subscription={subscription_name}, "
                    f"Prefetch={self.prefetch_count}, "
                    f"Pool={self.concurrency_pool_size}] ...")

        self.api_url = api_url
        self.headers = {
            "x-requested-with": "leek-agent",
            "x-agent-version": "1.0.0",
            "x-leek-org-name": org_name,
            "x-leek-app-name": app_name,
            "x-leek-app-key": app_key,
            "x-leek-app-env": app_env
        }

        # BROKER
        self.broker = broker
        self.connection = Connection(self.broker)
        self.event_type = "fanout" if self.connection.transport.driver_type == "redis" else "topic"
        self.exchange = Exchange(exchange, self.event_type, durable=True, auto_delete=False)
        self.queue = Queue(queue, exchange=self.exchange, routing_key=routing_key, durable=True, auto_delete=False)

        # CONNECTION TO BROKER
        self.ensure_connection_to_broker()
        self.init_fanout_queue()

        # CONNECTION TO API
        self.session = self.ensure_connection_to_api()
        adapter = adapters.HTTPAdapter(
            pool_connections=concurrency_pool_size,
            pool_maxsize=concurrency_pool_size
        )
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
        self.retry = False

    def ensure_connection_to_broker(self):
        logger.info(f"Ensure connection to the broker {self.connection.as_uri()}...")
        self.connection.ensure_connection(max_retries=10)
        logger.info("Broker is up!")

    def init_fanout_queue(self):
        logger.info("Declaring Exchange/Queue and binding them...")
        with Connection(self.broker) as conn:
            with conn.channel() as channel:
                self.queue.declare(channel=channel)
        logger.info("Exchange/Queue declared and bound!")

    def ensure_connection_to_api(self):
        logger.info(f"Ensure connection to the API {self.api_url}...")
        s = requests.Session()
        s.headers = self.headers
        s.options(
            url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT),
        ).raise_for_status()
        logger.info("API is up!")
        return s

    def get_consumers(self, Consumer, channel):
        """
        Build events consumer
        """
        logger.info("Configuring channel...")
        if self.connection.transport.driver_type == "redis":
            channel.basic_qos(prefetch_size=0, prefetch_count=self.prefetch_count)
        else:
            channel.basic_qos(prefetch_size=0, prefetch_count=self.prefetch_count, a_global=False)
        logger.info("Channel Configured...")

        logger.info("Creating consumer...")
        consumer = Consumer(self.queue, callbacks=[self.on_message], accept=['json'], tag_prefix=self.subscription_name)
        logger.info("Consumer created!")
        return [consumer]

    def on_message(self, body, message):
        """
        Callbacks used to send message to Leek API Webhooks endpoint
        :param body: Message body
        :param message: Message
        """
        if self.should_stop is not True:
            self._pool.spawn(self.handler, body, message)

    def handler(self, body, message):
        """
        Callbacks used to send message to Leek API Webhooks endpoint
        :param body: Message body
        :param message: Message
        """
        try:
            response = self.session.post(
                url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT),
                json=body,
            )
            response.raise_for_status()  # Raises a HTTPError if the status is 4xx, 5xxx
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            logger.error("Failed to connect to Leek API, Leek is Down.")
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            if status_code in self.BACKOFF_STATUS_CODES:
                logger.warning(e.response.content)
                logger.warning(
                    f"Failed to send message with status code {status_code}, "
                    f"backoff for {self.BACKOFF_DELAY_S} seconds."
                )
            else:
                logger.error(e.response.content)
                logger.error(f"status code: {e.response.status_code}")
        else:
            if response.status_code in self.SUCCESS_STATUS_CODES:
                # noinspection PyBroadException
                try:
                    message.ack()
                    return
                except Exception as ex:
                    logger.error(f"Unhealthy connection!")
                    logger.error(ex)
        self.backoff()

    def backoff(self):
        self.should_stop = True

    def run(self, _tokens=1, **kwargs):
        while True:
            time.sleep(self.BACKOFF_DELAY_S)
            if self.app_is_ready():
                logger.info("App is ready!")
            else:
                continue
            # Start/Resume Processing
            self.should_stop = False
            super(LeekConsumer, self).run(_tokens=1, **kwargs)

    def app_is_ready(self):
        try:
            response = self.session.get(
                url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT),
            )
            response.raise_for_status()
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            logger.error("Failed to connect to Leek API, Leek is Down.")
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            logger.warning(f"Application not ready with status code {status_code}")
            logger.warning(e.response.content)
        else:
            if response.status_code == 200:
                return True
        return False

    def on_connection_revived(self):
        logger.info("Connection revived!")

    def on_consume_ready(self, connection, channel, consumers, **kwargs):
        logger.info("Consumer ready!")

    def on_consume_end(self, connection, channel):
        logger.info("Consumer end!")
