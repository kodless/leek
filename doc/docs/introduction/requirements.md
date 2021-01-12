---
id: requirements
title: Requirements
sidebar_label: Requirements
---

Before using Leek, there are a set of configurations you will need to tweak in order for Leek to operate efficiently.

### Setup a firebase project

Leek uses firebase for Google SSO, you can use the default firebase project configuration but it's only supported for 
local development.

You can setup a new leek firebase project following [these steps](/docs/getting-started/firebase).

### Upgrade celery

To take advantage of good celery features used by Leek to enhance its monitoring capabilities, it's better to upgrade 
celery on your workers and clients to a newer version.

### Enable celery `task_track_started`

By default this celery setting it is disabled as the normal behavior is to not report that level of granularity. and by
default `task-started` events are not sent by workers

Tasks are either pending, finished, or waiting to be retried. Having a ‘started’ state can be useful for when there are 
long running tasks and there’s a need to report what task is currently running.

So, in order for Leek to catch `task-started` events, you will need to enable this setting on **workers level**.

[More info](https://docs.celeryproject.org/en/stable/userguide/configuration.html#task-track-started)

### Enable celery `task_track_started`

By default celery clients does not send `task-sent` events, Leek relies on those events to know some specific attributes 
that are not sent with other events and only sent by clients during `task-sent` events, these `task-sent` specific 
attributes includes task queue, exchange and routing key.

So it is recommended to enable this configuration if you want to know more details about the celery task.

[More info](https://docs.celeryproject.org/en/stable/userguide/configuration.html#task-send-sent-event)

### Enable `enable_utc`

Leek assumes that all timestamps in the received events are in UTC format. this will let us avoid the headache of 
transforming timestamps from different time zones.

You will need to enable this configuration on all celery workers and client instances in order for dates and times in 
messages to be sent in UTC.

Note that workers running Celery versions below 2.5 will assume a local timezone for all messages, so you will also 
need to upgrade workers for this to work.

[More info](https://docs.celeryproject.org/en/stable/userguide/configuration.html#enable-utc)

### Do not disable workers Heartbeat

Workers by default send `worker-heartbeat` to notify their liveness and progress.

if you disable heartbeats you will not be able to deduce if a worker is still online, also you will not be able to know 
some stats like the current active tasks, the processed tasks count and the load average.

And if a worker was not gracefully terminated (by SIGKILL signal) and did not emit `worker-offline` event, then the 
worker will still appear `online` but its correct state is `offline`. if you enable heartbeats you will know that 
something is wrong if you don't receive a heartbeat during a consecutive heartbeat intervals.

So it's recommended to not add `--without-heartbeat` when starting a worker and choose a lower but not too lower 
heartbeat interval, 10 seconds for example.

### Do not disable workers communication

Workers can passively subscribe to worker related events like heartbeats. This means that a worker knows what other 
workers are doing and can detect if they go offline. Currently this is only used for clock synchronization.

Workers communication is useful for Leek to keep workers clock synchronized, if the workers clock is not in sync, Leek 
will not be able to use Lamport Logical Clock value to order events and will have to use physical clock (timestamps) to
order events and show the exact task state.

In a distributed system it's recommended to use Logical Lamport Clocks instead of Physical Timestamp Clocks to solve 
precedence issues, So it's recommended to not disable this bootstep using the `--without-gossip` argument.

