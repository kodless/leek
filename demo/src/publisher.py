import time

from leek_demo.tasks.low import failed_task, succeeded_task, rejected_task, parent_task, kwargs_task
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
    kwargs_task.delay(x=12, y=4, string="test", boolean=True, array=[3, 9], dictionary={"f_name": "John", "l_name": "Doe"})
    time.sleep(1)
