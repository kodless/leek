---
id: features
title: Features
sidebar_label: Features
---

As opposed to many other alternatives, leek came to fix the issues existing in other tools and offer many other cool 
features that does not exist in other tools:

- `Google SSO` - you can connect to leek using GSuite accounts for organizations and standard GMail accounts for
individuals.

- `Multi brokers support` - other monitoring tools can connect to only one broker at a time, which enforces you to 
deploy many instances to monitor them all. however, Leek with its Agent, it can monitor tasks from multiple brokers with 
only a single instance of leek.

- `Multi ENVs support` - when connecting Leek agent to brokers, you can specify an environment tag for that broker and 
each event sent from that broker will be tagged with that environment name, allowing you to split celery events into 
qa, stg, prod subsets so later you can filter task by environment name.

- `Enhanced storage` - unlike other alternatives that stores the events in volatile RAM, celery events are indexed to 
elasticsearch to offer persistence and fast retrieval/search.

- `Beatiful UI` - unlike other alternatives which are either a command line tool or have an ugly UI, Leek offers a 
great user experience thanks to its beautiful well designed UI.

- `Notification` - you can define notification rules that will trigger a slack notification to inform you about critical
events, the notification triggers rules can match against task state, task name exclusion/exclusions, environment name, 
and runtime upper bound.

- `Monitor Issues` - Leek can also monitor issues by aggregating the failed tasks by exception name, and for each 
exception it will calculate occurrences, recovered, pending, failed and critical exceptions.

- `Charts` - Leek generate multiple charts giving you an idea about the application state, these chart includes: 
tasks states distribution, tasks queues distribution, top 5 executed tasks, top 5 slow tasks, tasks execution over time,
tasks queue over time, tasks failure over time ...

- `Filter by anything` - unlike other alternatives that doesn't provide a good support for filters, leek provides a wide
range of filters.

