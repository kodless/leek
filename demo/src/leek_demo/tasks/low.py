from celery.exceptions import Reject

from leek_demo.app import app
from leek_demo.tasks.medium import child_task


@app.task
def parent_task():
    child_task.delay()


@app.task
def succeeded_task(x, y):
    return x / y


@app.task
def kwargs_task(x: int = 12, y: int = 4, string: str = "test", boolean: bool = True, array: list = None,
                dictionary: dict = None):
    return x / y


@app.task
def failed_task():
    return 4 / 0


@app.task(bind=True, acks_late=True)
def rejected_task(self):
    raise Reject("Test rejection", requeue=False)
