from celery.exceptions import Reject

from leek_test.app import app
from leek_test.tasks.medium import child_task


@app.task
def parent_task():
    child_task.delay()


@app.task
def succeeded_task(x, y):
    return x / y


@app.task
def failed_task():
    return 4 / 0


@app.task(bind=True, acks_late=True)
def rejected_task(self):
    raise Reject("Test rejection", requeue=False)
