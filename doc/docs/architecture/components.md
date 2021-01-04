---
id: components
title: Components
sidebar_label: Components
---

Leek architecture is composed of three main components:

- `Leek Agent` - connects to the broker, subscribe to queues and fanout messages to the target API webhook endpoint.

- `Leek API` - receives webhook events from agent(s) and index (upsert) events to ElasticSearch DB.

- `Leek WEB` - frontend application that connects to Leek API and used by users to monitor workers/tasks.

![Leek components](/img/components.svg)
