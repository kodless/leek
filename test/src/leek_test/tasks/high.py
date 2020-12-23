import random

from leek_test.app import app


@app.task(autoretry_for=(Exception,),
          retry_kwargs={'max_retries': 3})
def retried_task():
    if random.choice([0, 1]):
        raise Exception("I'm retrying my self")
    return "I'm a survival"
