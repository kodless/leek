import time

from leek_demo.tasks.low import failed_task, succeeded_task, rejected_task, parent_task
from leek_demo.tasks.high import critical_task, revoked_expired_task, recovered_task, revoked_terminated_task

while True:
    succeeded_task.delay(4, 4)
    failed_task.delay()
    rejected_task.delay()
    critical_task.delay()
    revoked_expired_task.delay()
    revoked_terminated_task.delay()
    recovered_task.delay()
    parent_task.delay()
    time.sleep(1)
