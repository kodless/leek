import time

from leek_test.tasks import divide, rejected_task, retried_task

while True:
    # Success
    divide.delay(4, 4)
    # Failure
    divide.delay(4, 0)
    # Rejected
    rejected_task.delay()
    # Retried
    retried_task.delay()
    # Sleep
    time.sleep(30)
