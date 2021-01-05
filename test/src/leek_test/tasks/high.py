import signal

import time

from leek_test.app import app


@app.task(autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def critical_task():
    """Will always fail/retry until max_retries"""
    raise Exception("I'm a looser")


@app.task(autoretry_for=(Exception,), retry_kwargs={'max_retries': 3}, expires=120)
def revoked_expired_task():
    """Will fail/retry/.../expire"""
    raise Exception("I will certainly expire")


@app.task()
def revoked_terminated_task():
    """Will be terminated"""
    app.control.revoke(revoked_terminated_task.request.id, terminate=True, signal=signal.SIGTERM)
    time.sleep(10)


@app.task(autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def recovered_task():
    """Will fail/retry/.../succeed"""
    if recovered_task.request.retries > 1:
        return "I'm a survival"
    raise Exception("I'm retrying my self")
