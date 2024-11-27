import os

from celery import Celery
from kombu import Queue

app = Celery('tasks', broker=os.environ['BROKER_URL'])

app.conf.task_send_sent_event = True
app.conf.task_track_started = True
app.conf.imports = (
    "leek_demo.tasks.low",
    "leek_demo.tasks.medium",
    "leek_demo.tasks.high",
)
app.conf.task_queues = (
    Queue("low", routing_key="low"),
    Queue("medium", routing_key="medium"),
    Queue("high", routing_key="high"),
)
app.conf.default_queue = "low"
app.conf.default_exchange = "tasks"
app.conf.default_exchange_type = "direct"
app.conf.default_routing_key = "low"

app.conf.task_routes = {
    "leek_demo.tasks.low.*": {"queue": "low"},
    "leek_demo.tasks.medium.*": {"queue": "medium"},
    "leek_demo.tasks.high.*": {"queue": "high"},
}

# For celery versions < 4
# app.conf.update(
#     {
#         "CELERY_SEND_TASK_SENT_EVENT": True,
#         # Just for demo
#         "CELERY_IMPORTS": (
#             "leek_demo.tasks.low",
#             "leek_demo.tasks.medium",
#             "leek_demo.tasks.high",
#         ),
#         "CELERY_QUEUES": (
#             Queue("low", routing_key="low"),
#             Queue("medium", routing_key="medium"),
#             Queue("high", routing_key="high"),
#         ),
#         "CELERY_DEFAULT_QUEUE": "low",
#         "CELERY_DEFAULT_EXCHANGE": "tasks",
#         "CELERY_DEFAULT_EXCHANGE_TYPE": "direct",
#         "CELERY_DEFAULT_ROUTING_KEY": "low",
#         "CELERY_ROUTES": (
#             {"leek_demo.tasks.low.*": {"queue": "low"}},
#             {"leek_demo.tasks.medium.*": {"queue": "medium"}},
#             {"leek_demo.tasks.high.*": {"queue": "high"}},
#         ),
#     }
# )
