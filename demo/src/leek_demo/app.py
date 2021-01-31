import os

from celery import Celery
from kombu import Queue

app = Celery('tasks', broker=os.environ['BROKER_URL'])

app.conf.update(
    {
        "CELERY_SEND_TASK_SENT_EVENT": True,
        # Just for demo
        "CELERY_IMPORTS": (
            "leek_demo.tasks.low",
            "leek_demo.tasks.medium",
            "leek_demo.tasks.high",
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
            {"leek_demo.tasks.low.*": {"queue": "low"}},
            {"leek_demo.tasks.medium.*": {"queue": "medium"}},
            {"leek_demo.tasks.high.*": {"queue": "high"}},
        ),
    }
)
