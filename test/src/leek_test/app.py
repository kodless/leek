import os

from celery import Celery
from kombu import Queue

app = Celery('tasks', broker=os.environ['BROKER_URL'])

app.conf.update(
    {
        "CELERY_SEND_TASK_SENT_EVENT": True,
        # Just for demo
        "CELERY_IMPORTS": (
            "leek_test.tasks.low",
            "leek_test.tasks.medium",
            "leek_test.tasks.high",
        ),
        "CELERY_QUEUES": (
            Queue("low", routing_key="low"),
            Queue("medium", routing_key="medium"),
            Queue("high", routing_key="high"),
        ),
        "CELERY_DEFAULT_QUEUE": "low",
        "CELERY_DEFAULT_EXCHANGE": "tasks",
        "CELERY_DEFAULT_EXCHANGE_TYPE": "direct",
        "CELERY_DEFAULT_ROUTING_KEY": "low",
        "CELERY_ROUTES": (
            {"leek_test.tasks.low.*": {"queue": "low"}},
            {"leek_test.tasks.medium.*": {"queue": "medium"}},
            {"leek_test.tasks.high.*": {"queue": "high"}},
        ),
    }
)
