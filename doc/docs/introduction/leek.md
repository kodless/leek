---
id: leek
title: Leek?
sidebar_label: Leek?
---

### What is Leek?

Leek is a celery tasks monitoring tool, the main difference between Leek and other monitoring tools is that Leek can 
connect to and monitor many brokers with a single container whereas other tools can monitor only a single broker at a 
time.

Also leek supports environments branching, multiple applications, Google SSO, charts, issues monitoring, advanced 
filtering and search, indexation and persistence, slack notifications and provides an awesome UI for a better user 
experience.

Leek came to remediate the issues found with other celery monitoring tools and provide a reliable results and cool 
features to ease the process of monitoring your celery cluster, finding and respond to issues quickly.

### What Leek is not?

Leek is not a celery tasks/workers control tool and you cannot use leek to revoke/terminate/start tasks, restart your 
workers fleet, or manage your brokers. however control features could be supported with future releases.

Leek is not a package that can be installed/imported but a full stack application published as a docker image.

> Starting from leek version 0.4.0 there will be support for control features, and as a start we have introduced the 
> first control feature which is task retry, task retry is an experimental feature for now, and tasks part of a chain,
> chords or groups will not be run as part of them.

