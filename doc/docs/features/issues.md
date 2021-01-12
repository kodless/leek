---
id: issues
title: Issues
sidebar_label: Issues
---

Leek provide a separate page to track issues, the issues page will give you an idea about the different seen exceptions 
in each application, Leek will aggregate events by exception name and returns basic statistics, with these statistics 
you can track for each exception:

![Issues](/img/docs/issues.png)

- **Occurrence** - how many occurrences of the issue.

- **Retry** - how many tasks are waiting to be retried.

- **Revoked** - how many tasks were revoked.

- **In Progress** - how many failed tasks that are in progress.

- **Failed** - how many failed tasks.

- **Critical** - how many critical tasks were failed after max retries.

- **Recovered** - how many recovered tasks were succeeded after one or many retries.
