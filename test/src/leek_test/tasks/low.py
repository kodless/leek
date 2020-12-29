from celery.exceptions import Reject

from leek_test.app import app
from leek_test.tasks.medium import child


@app.task
def divide(x, y):
    child.delay()
    return x / y


@app.task()
def rejected_task():
    raise Reject("Test rejection", requeue=False)

