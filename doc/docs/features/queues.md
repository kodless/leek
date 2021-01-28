---
id: queues
title: Queues
sidebar_label: Queues
---

![Issues](/img/docs/queues.png)

Leek provides a separate page to track queues, giving you an idea about the state of all queues in each 
application, Leek will aggregate events by queue name and returns basic statistics, with these statistics 
you can track for each queue:

- **Messages** - Messages flow.

- **Queued** - how many tasks that are still in the queue.

- **Received** - how many tasks pre-fetched by consumers (workers)

- **Started** - how many tasks that are in progress.

- **Succeeded** - how many succeeded tasks,

- **Recovered** - how many recovered tasks were succeeded after one or many retries.

- **Retry** - how many failed tasks are waiting to be retried.

- **Failed** - how many failed tasks.

- **Critical** - how many critical tasks were failed after max retries.

- **Revoked** - how many tasks were revoked.
