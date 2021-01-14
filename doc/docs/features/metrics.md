---
id: metrics
title: Metrics
sidebar_label: Metrics
---

Leek provides a set of basic metrics on its dashboard, you can have a general idea about your application state by 
looking at these metrics, you can also filter by environment to load metrics for a specific environment, these metrics
includes:

![Login](/img/docs/metrics.png)

- **Total Tasks** - Seen distinct tasks names.

- **Total Workers** - Seen distinct workers hostnames.

- **Events Processed** - Events sent by Leek Agent and processed (indexed) by Leek API.

- **Tasks Processed** - Seen distinct tasks UUIDs.

- **Tasks Queued** - Tasks in the queues waiting to be processed. set `task_send_sent_event` to `True` on clients level 
to report started tasks

- **Received** - Tasks were received by a worker. but not yet started.

- **Started** - Tasks were started by a worker and still active, set `task_track_started` to `True` on workers level to 
report started tasks.

- **Succeeded** - Tasks that were succeeded without any retries/failure.

- **Recovered** - Tasks that were succeeded after one or more retries.

- **Failed** - Tasks that were failed without any retries.

- **Critical** - Tasks that were failed after max retries.

- **To Retry** - Tasks that were failed and waiting for retry.

- **Rejected** - Tasks that were rejected by workers and requeued, or moved to a dead letter queue.

- **Revoked** - Tasks that were revoked by workers, but still in the queue.
