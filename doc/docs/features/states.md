---
id: states
title: States
sidebar_label: States
---

### Tasks states

A task can be in the following celery states:

- <img src="/img/docs/task-queued.png" height="28" align="center" /> - Task queued
- <img src="/img/docs/task-received.png" height="28" align="center" /> - Task received by worker
- <img src="/img/docs/task-started.png" height="28" align="center" /> - Task started by worker
- <img src="/img/docs/task-succeeded.png" height="28" align="center" /> - Task succeeded 
- <img src="/img/docs/task-failed.png" height="28" align="center" /> - Task failed
- <img src="/img/docs/task-retry.png" height="28" align="center" /> - Task waiting for retry
- <img src="/img/docs/task-rejected.png" height="28" align="center" /> - Task rejected
- <img src="/img/docs/task-revoked.png" height="28" align="center" /> - Task revoked

In addition to standard celery states, Leek adds additional custom states to the mix to give you a more context about 
task states, these custom states includes:

- <img src="/img/docs/task-recovered.png" height="28" align="center" /> - Task succeeded after one or many retries.
- <img src="/img/docs/task-critical.png" height="28" align="center" /> - Task failed after max retries.

Leek also adds multiple tags to tasks state to give you insights about what happened to the task before reaching that 
state. these are some examples of states with tags:

- <img src="/img/docs/task-recovered-tag.png" height="28" align="center" /> - Task recovered after 2 retries.
- <img src="/img/docs/task-critical-tag.png" height="28" align="center" /> - Task failed after 3 max retries.
- <img src="/img/docs/task-revoked-expired.png" height="28" align="center" /> - Task revoked because it's (E)xpired 
after 1 retry.
- <img src="/img/docs/task-revoked-terminated.png" height="28" align="center" /> - Task revoked because it was 
(T)erminated
- <img src="/img/docs/task-rejected-ignored.png" height="28" align="center" /> - Task rejected and (I)gnored.
- <img src="/img/docs/task-rejected-requeued.png" height="28" align="center" /> - Task rejected and re(Q)ueued.
- <img src="/img/docs/task-retry-tag.png" height="28" align="center" /> - Task waiting to retry for the third time.
- <img src="/img/docs/task-received-tag.png" height="28" align="center" /> - Task received by worked after 1 failed 
execution.

### Worker states
- <img src="/img/docs/worker-online.png" height="28" align="center" /> - Worker maybe online but does not send heatbeats

- <img src="/img/docs/worker-heartbeat.png" height="28" align="center" /> - Worker is online and sending heartbeats.

- <img src="/img/docs/worker-offline.png" height="28" align="center" /> - Worker is offline, left the cluster.