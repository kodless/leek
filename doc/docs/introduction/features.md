---
id: features
title: Features
sidebar_label: Features
---

As opposed to many other alternatives, leek offers many features:

- `Google SSO`: | you can connect to leek using GSuite accounts for organization and standard GMail account for
individuals.

- `Multi brokers support` | Other monitoring tools can connect to only one broker at a time, which enforces you to 
deploy many instances monitor them all. however Leek with its Agent, it can monitor tasks from multiple brokers with 
only a single instance of leek.

- `Multi ENVs support` | When connecting Leek agent to brokers, you can specify an environment tag for that broker and 
each event sent from that broker will be tagged with environment name, this will help you split celery events into qa, 
stg, prod subsets so later you can filter task by environment name.

- `Enhanced storage` | Unlike other alternatives that stores the events in volatile RAM, celery events are indexed to 
elasticsearch to offer persistence and fast retrieval/search.

- `Beatiful UI` | Unlike other alternatives which either only a command line tool or have a very bad UI, with Leek you 
will have a great user experience thanks to its beautiful well designed UI.

- `Notification` | You can define notification rules that will trigger a slack notification to inform you about critical
events, the notification triggers rules support task state, exclude/include task names, environment name, and runtime 
upper bound.

- `Monitor Issues`: | with Leek you can monitor issues, Leek will aggregate the failed tasks by exception name, and for 
each exception it will calculate occurrences, recovered, pending, failed and critical exceptions.

- `Charts`: | Leek offers multiple charts that will give you an idea about the application state, these chart includes: 
tasks states distribution, tasks queues distribution, top 5 executed tasks, top 5 slow tasks, tasks execution over time,
tasks queue over time, tasks failure over time ...

- `Filter by anything`: | unlike other alternatives that doesn't provide a good support for filters, leek provide a wide
range of filters.

