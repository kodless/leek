import os

from celery import Celery
from celery.exceptions import Reject

app = Celery('tasks', broker=os.environ['BROKER_URL'])


@app.task
def child():
    return "I'm a child"


@app.task
def divide(x, y):
    child.delay()
    return x / y


@app.task()
def rejected_task():
    raise Reject("Test rejection", requeue=False)


@app.task()
def rejected_task():
    raise Reject("Test rejection", requeue=False)


@app.task(autoretry_for=(Exception,),
          retry_kwargs={'max_retries': 3})
def retried_task():
    raise Exception("I'm retrying my self")
