import sys
import time
import random
import socket
from urllib.parse import urljoin
from collections import OrderedDict
from typing import Dict, List, Union, Iterable

import requests
from requests import adapters

from kombu import Exchange, Queue, Connection
from kombu.mixins import ConsumerMixin
from kombu.exceptions import OperationalError, ChannelError

from leek.agent.logger import get_logger
from leek.agent.adapters.serializer import validate_payload

logger = get_logger(__name__)


def flatten(obj: Iterable[Union[List[Dict], Dict]]) -> Iterable[Dict]:
    for sublist in obj:
        if isinstance(sublist, list):
            for item in sublist:
                yield item
        elif isinstance(sublist, dict):
            yield sublist


class LeekConsumer(ConsumerMixin):
    SUCCESS_STATUS_CODES = [200, 201]
    BACKOFF_STATUS_CODES = [400, 404, 503]

    # App/HTTP backoff (unchanged)
    BACKOFF_DELAY_S = 5

    # Broker reconnect backoff
    RECONNECT_BASE_S = 2        # start at 2s
    RECONNECT_MAX_S = 60        # cap at 60s
    HEARTBEAT_S = 30            # RabbitMQ/AmazonMQ-friendly heartbeat

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
            # Optional: allow failover strategy if multiple URLs are given (semicolon-separated)
            failover_strategy: str = "round-robin",  # or "shuffle"
    ):
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
        logger.info(
            f"Building consumer [Subscription={subscription_name}, Prefetch={self.prefetch_count}]"
        )

        self.api_url = api_url
        self.app_name = app_name
        self.app_env = app_env
        self.headers = {
            "x-requested-with": "leek-agent",
            "x-agent-version": "1.0.0",
            "x-leek-org-name": org_name,
            "x-leek-app-name": app_name,
            "x-leek-app-key": app_key,
            "x-leek-app-env": app_env,
        }

        # BROKER — enable heartbeats; allow URL failover
        # Kombu supports a semicolon-separated list: "amqps://A;amqps://B"
        self.broker = broker
        self.failover_strategy = failover_strategy
        self.connection = self._new_connection()

        # Transport dependent topology
        self.event_type = (
            "fanout" if self.connection.transport.driver_type == "redis" else "topic"
        )
        self.exchange = Exchange(exchange, self.event_type, durable=True, auto_delete=False)
        self.queue = Queue(
            queue,
            exchange=self.exchange,
            routing_key=routing_key,
            durable=True,
            auto_delete=False,
        )
        self.channel = None

        # CONNECTION TO BROKER (resilient)
        self.ensure_connection_to_broker()
        self.init_fanout_queue()

        # CONNECTION TO API
        self.session = self.ensure_connection_to_api()
        adapter = adapters.HTTPAdapter(
            pool_connections=concurrency_pool_size, pool_maxsize=concurrency_pool_size
        )
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self.retry = False

        # Internal flag used by our app-level backoff
        self.should_stop = False

    # ---------- Connection helpers ----------

    def _new_connection(self) -> Connection:
        """
        Create a new Kombu connection with heartbeat and retry policy suited for
        AmazonMQ/RabbitMQ maintenance windows.
        """
        # If multiple URLs are provided, Kombu will fail over between them.
        return Connection(
            self.broker,
            heartbeat=self.HEARTBEAT_S,
            connect_timeout=10,
            transport_options={
                # Retry policy for underlying transport reconnect attempts
                "retry_policy": {
                    "interval_start": 0,  # First retry immediately
                    "interval_step": 2,   # Then +2s, +4s, ...
                    "interval_max": 30,   # Cap within transport
                    "max_retries": 100,   # Large number; we still wrap with our loop
                },
                # Better observability in RabbitMQ management UI
                "client_properties": {
                    "connection_name": f"leek-consumer::{self.subscription_name}"
                },
            },
            failover_strategy=self.failover_strategy,
        )

    def ensure_connection_to_broker(self):
        """Ensure we are connected; loop with exponential backoff during outages."""
        delay = self.RECONNECT_BASE_S
        while True:
            try:
                logger.info(f"Ensure connection to the broker {self.connection.as_uri()}...")
                # ensure_connection will try a few times itself based on retry_policy
                self.connection.ensure_connection(max_retries=3)
                logger.info("Broker is up!")
                return
            except (OperationalError, socket.error) as exc:
                # Typical during AmazonMQ maintenance: TCP resets, refused connections, etc.
                jitter = random.uniform(0, delay * 0.25)
                sleep_for = min(self.RECONNECT_MAX_S, delay) + jitter
                logger.warning(
                    f"Broker not reachable ({exc.__class__.__name__}: {exc}). "
                    f"Retrying in ~{sleep_for:.1f}s..."
                )
                time.sleep(sleep_for)
                delay = min(self.RECONNECT_MAX_S, delay * 2)
                # Recreate the Connection object each cycle to drop bad state
                try:
                    self.connection.close()
                except Exception:
                    pass
                self.connection = self._new_connection()

    def _reopen_after_connection_loss(self):
        """Called when the consumer loop exits due to connection loss."""
        logger.info("Re-opening connection after loss...")
        self.ensure_connection_to_broker()
        self.init_fanout_queue()  # idempotent re-declare

    def init_fanout_queue(self):
        logger.info("Declaring Exchange/Queue and binding them...")
        with self._new_connection() as conn:
            with conn.channel() as channel:
                self.queue.declare(channel=channel)
        logger.info("Exchange/Queue declared and bound!")

    # ---------- API connectivity ----------

    def ensure_connection_to_api(self):
        logger.info(f"Ensure connection to the API {self.api_url}...")
        s = requests.Session()
        s.headers = self.headers
        s.options(url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT)).raise_for_status()
        logger.info("API is up!")
        return s

    # ---------- Kombu mixin hooks ----------

    def get_consumers(self, Consumer, channel):
        logger.info("Configuring channel...")
        # QoS must be set every time the channel is (re)opened
        if self.connection.transport.driver_type == "redis":
            channel.basic_qos(prefetch_size=0, prefetch_count=self.prefetch_count)
        else:
            channel.basic_qos(prefetch_size=0, prefetch_count=self.prefetch_count, a_global=False)
        self.channel = channel
        logger.info("Channel Configured...")

        logger.info("Creating consumer...")
        consumer = Consumer(
            self.queue,
            callbacks=[self.on_message],
            accept=["json"],
            tag_prefix=self.subscription_name,
            auto_declare=True,  # let Consumer ensure topology on (re)start too
        )
        logger.info("Consumer created!")
        return [consumer]

    def on_connection_revived(self):
        logger.info("Connection revived! Re-declaring topology & QoS.")
        try:
            self.init_fanout_queue()
        except Exception as exc:
            logger.warning(f"Topology re-declare failed (ignored): {exc}")

    def on_consume_ready(self, connection, channel, consumers, **kwargs):
        logger.info("Consumer ready!")

    def on_consume_end(self, connection, channel):
        logger.info("Consumer end!")

    # ---------- Message handling ----------

    def on_message(self, body, message):
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
        logger.debug(f"Latest delivery tag: {self.batch_latest_delivery_tag}")
        if self.connection.transport.driver_type == "redis":
            for delivery_tag in self.batch.keys():
                self.channel.basic_ack(delivery_tag)
        else:
            self.channel.basic_ack(self.batch_latest_delivery_tag, multiple=True)
        self.init_batch()

    def send(self):
        start_time = time.time()
        payload = flatten(self.batch.values())
        try:
            events = validate_payload(payload, self.app_env)
            docs = [event.to_doc() for _, event in events.items()]
        except Exception as ex:
            logger.error(ex)
            return
        try:
            response = self.session.post(
                url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT), json=docs
            )
            response.raise_for_status()
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
                try:
                    logger.debug("--- Processed by API in %s seconds ---" % (time.time() - start_time))
                    if response.status_code == 201:
                        self.ack()
                    return
                except Exception as ex:
                    logger.error("Unhealthy connection!")
                    logger.error(ex)
        self.backoff()

    def backoff(self):
        self.should_stop = True
        self.init_batch()

    # ---------- Main run loop with resilient reconnect ----------

    def run(self, _tokens=1, **kwargs):
        """
        Outer loop that survives broker outages. We enter the Kombu ConsumerMixin.run()
        and if it exits due to OperationalError/ChannelError (typical during maintenance),
        we reconnect & restart.
        """
        while True:
            # Wait for API health if we previously backed off due to API errors
            time.sleep(self.BACKOFF_DELAY_S)
            if self.app_is_ready():
                logger.info("App is ready!")
            else:
                continue

            self.should_stop = False

            try:
                # This blocks until an error happens or should_stop toggles
                super(LeekConsumer, self).run(_tokens=1, **kwargs)
            except (OperationalError, ChannelError, socket.error) as exc:
                # Connection/channel broke (maintenance window, broker restart, etc.)
                logger.warning(f"Consumer loop interrupted: {exc}. Will attempt to reconnect...")
                self._reopen_after_connection_loss()
                # Loop continues and we re-enter run()
                continue
            except Exception as exc:
                # Unknown error: log and attempt a controlled restart
                logger.error(f"Unexpected error in consumer loop: {exc}", exc_info=True)
                self._reopen_after_connection_loss()
                continue

    def app_is_ready(self):
        try:
            response = self.session.get(url=urljoin(self.api_url, self.LEEK_WEBHOOKS_ENDPOINT))
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
