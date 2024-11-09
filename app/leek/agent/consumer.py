import sys
import time
from urllib.parse import urljoin
from collections import OrderedDict
from typing import Dict, List, Union, Iterable

import requests
from requests import adapters
from kombu.mixins import ConsumerMixin
from kombu import Exchange, Queue, Connection

from leek.agent.logger import get_logger
from leek.agent.adapters.serializer import validate_payload

logger = get_logger(__name__)


def flatten(obj: Iterable[Union[List[Dict], Dict]]) -> Iterable[Dict]:
    """Flatten a list using generators comprehensions.
        Returns a flattened version of list lst.
    """
    for sublist in obj:
        if isinstance(sublist, list):
            for item in sublist:
                yield item
        elif isinstance(sublist, dict):
            yield sublist


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
            broker_management_url: str = "http://localhost:15672",
            backend: str = None,
            exchange: str = "celeryev",
            queue: str = "leek.fanout",
            routing_key: str = "#",
            prefetch_count: int = 1000,
            concurrency_pool_size: int = 1,
            batch_max_size_in_mb=1,
            batch_max_number_of_messages=1000,
            batch_max_window_in_seconds=5,
    ):
        """
        :param api_url: The URL of the API where to fanout events
        :param org_name: Leek org name, GMail username for standard users and domain name for GSuite users
        :param app_name: Leek app name, chosen when creating application
        :param app_key: Leek app key, provided after the application has been created
        :param app_env: Leek app env, broker messages env name
        :param broker: Broker url
        :param broker_management_url: Broker management url
        :param exchange: Exchange name, should be the same as workers event exchange
        :param queue: Queue name
        :param routing_key: Routing key
        :param batch_max_size_in_mb: Maximum size of batch, should be less than Elasticsearch max batch size.
        :param batch_max_number_of_messages: Maximum number of messages in a batch, should be less than prefetch count.
        :param batch_max_window_in_seconds: Maximum wait time to send each batch, should be less than message timeout.
        """

        # HTTP batch transport settings
        self.batch = OrderedDict()
        self.batch_max_size_in_mb = batch_max_size_in_mb
        self.batch_max_number_of_messages = batch_max_number_of_messages
        self.batch_max_window_in_seconds = batch_max_window_in_seconds
        self.batch_last_sent_at = time.time()
        self.batch_latest_delivery_tag = None

        # API
        self.subscription_name = subscription_name
        self.prefetch_count = prefetch_count
        logger.info(f"Building consumer "
                    f"[Subscription={subscription_name}, "
                    f"Prefetch={self.prefetch_count}, ")

        self.api_url = api_url
        self.app_name = app_name
        self.app_env = app_env
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
        # Events over redis transport are not durable because celery sends them in fanout mode
        # Therefore, at the time leek is up and start listening to events it will not be able
        # to process the events sent to redis when leek was down.
        # If you want the events to be persisted, use RabbitMQ instead!
        self.event_type = "fanout" if self.connection.transport.driver_type == "redis" else "topic"
        self.exchange = Exchange(exchange, self.event_type, durable=True, auto_delete=False)
        self.queue = Queue(queue, exchange=self.exchange, routing_key=routing_key, durable=True, auto_delete=False)
        self.channel = None

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
        self.channel = channel
        logger.info("Channel Configured...")

        logger.info("Creating consumer...")
        consumer = Consumer(self.queue, callbacks=[self.on_message], accept=['json', 'application/x-python-serialize'], tag_prefix=self.subscription_name)
        logger.info("Consumer created!")
        return [consumer]

    def on_message(self, body, message):
        """
        Callbacks used to send message to Leek API Webhooks endpoint
        :param body: Message body
        :param message: Message
        """
        if self.should_stop is not True:
            self.batch.update({message.delivery_tag: body})
            self.batch_latest_delivery_tag = message.delivery_tag
            if (sys.getsizeof(self.batch) / 1024 / 1024) >= self.batch_max_size_in_mb:
                logger.debug("BATCH: maximum size in mb reached, send!")
            elif len(self.batch) >= self.batch_max_number_of_messages:
                logger.debug("BATCH: maximum number of messages reached, send!")
            elif (time.time() - self.batch_last_sent_at) >= self.batch_max_window_in_seconds:
                logger.debug("BATCH: maximum wait window reached, send!")
            else:
                logger.debug(f"BATCH: not yet fulfilled, {len(self.batch)} skip!")
                return
            self.send()

    def init_batch(self):
        self.batch = OrderedDict()
        self.batch_last_sent_at = time.time()
        self.batch_latest_delivery_tag = None

    def ack(self):
        """
        Acknowledge all processed events in the queue by acknowledging latest event.
        All events before the acknowledged event will be auto ACK by rabbitmq server.
        :return:
        """
        logger.debug(f"Latest delivery tag: {self.batch_latest_delivery_tag}")
        if self.connection.transport.driver_type == "redis":
            # Redis transport does not support multiple messages acknowledgment
            for delivery_tag in self.batch.keys():
                self.channel.basic_ack(delivery_tag)
        else:
            self.channel.basic_ack(self.batch_latest_delivery_tag, multiple=True)
        self.init_batch()

    def send(self):
        """
        Callbacks used to send message to Leek API Webhooks endpoint
        """
        # Prepare
        start_time = time.time()
        payload = flatten(self.batch.values())
        try:
            events = validate_payload(payload, self.app_env)
            docs = [event.to_doc() for _, event in events.items()]
        except Exception as ex:
            logger.error(ex)
            return
        # Send
        try:
            response = self.session.post(
                url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT),
                json=docs,
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
                    logger.debug("--- Processed by API in %s seconds ---" % (time.time() - start_time))
                    if response.status_code == 201:
                        self.ack()
                    return
                except Exception as ex:
                    logger.error(f"Unhealthy connection!")
                    logger.error(ex)
        self.backoff()

    def backoff(self):
        self.should_stop = True
        self.init_batch()

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
