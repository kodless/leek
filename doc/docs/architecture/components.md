---
id: components
title: Components
sidebar_label: Components
---

Leek architecture is composed of three main components:

- `Leek Agent` - connects to the broker, subscribe to queues and fanout messages to the target API webhook endpoint.

- `Leek API` - receives webhook events from agent(s) and index (upsert) events to ElasticSearch DB.

- `Leek WEB` - frontend application that connects to Leek API and used by users to monitor workers/tasks.

- `Elasticsearch` - receives events from Leek API and index them and respond to aggregation and search queries.

> Leek agent can be run as a standalone agent separate for Leek application or as a local agent with Leek API and Leek
> Web. the former can be useful if you don't have control over your brokers infrastructure, a third party entity can 
> install the standalone agent in its infrastructure and fanout the tasks result to your API. whereas the later can be 
> used if you are the owner of the brokers and you have network access to them.
> [Learn more](/docs/getting-started/agent)


> Elasticsearch can be run as a standalone instance separate from Leek application as a local elasticsearch DB side by 
> side with your Agent and the API, the former is useful if you want to persist events and avoid data loss during leek
> CI/CD or when leek experience an issue whereas the later can be used if you don't mind losing events data when rolling
> updates.
> [Learn more](/docs/getting-started/es) 

![Leek components](/img/components.svg)