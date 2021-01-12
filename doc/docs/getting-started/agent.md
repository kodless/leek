---
id: agent
title: Agent
sidebar_label: Agent
---

Leek agent is a simple python client connects to brokers and fanout events to Leek api. the communication between the 
agent and the brokers is done with AMQP protocol using the package Kombu. and the concurrency to support multiple brokers
is achieved with GEvent.

### Leek agents bootsteps

- The agent starts by loading the subscriptions configuration from environment variable.
- Performs a healthcheck against the brokers and APIs in each subscription.
- For each subscription, the agent spawn a GEvent GreenLet and wait
- Each GreenLet connects to the broker and fanout received messages to Leek API.

### Leek agent modes

Depending on your use case, the agent can be run as a standalone agent or local agent:

Standalone agent: if you don't have network access to brokers because they live in another infrastructure that does not 
belong to you. you can instruct infrastructure owners to use the standalone Leek agent to fanout events to your Leek 
API. the communication will be secured between the standalone agent and the API using the the api key defined in the 
subscriptions environments variable. you can enable standalone agent by setting `LEEK_ENABLE_AGENT` to true and disable all 
other services by setting `LEEK_ENABLE_API`, `LEEK_ENABLE_WEB` and `LEEK_ENABLE_ES` false.

Local agent: Leeks ships with a local agent which can be run alongside leek API, the communication between Leek API and 
Leek Agent is internal and secured using the shared secret from `LEEK_AGENT_API_SECRET`. Leek does not use the 
application api key generated when the application is created and configured in subscriptions environment and will 
always fallback to the `LEEK_AGENT_API_SECRET` when using local agent, to enable local agent you can set both 
`LEEK_ENABLE_API` and `LEEK_ENABLE_AGENT` to true.

### Leek subscriptions

Leek subscriptions is a json object with one or more subscription, each subscription has a unique name and a set of 
parameters to connect to the broker and API.

![Agent](/img/docs/agent.png)

- Required parameters:
    - **broker** - the amqp url of the broker (only rabbitmq is supported for now).
    - **backend** - the result backend url
    - **virtual_host** - the rabbitmq virtual host for RabbitMQ brokers.
    - **exchange** - should be the same as the exchange used by clients and worker defined by `event_exchange`  [Learn More](https://docs.celeryproject.org/en/stable/userguide/configuration.html#event-exchange)
    - **queue** - the queue used to store the events
    - **routing_key** - should be `#` for now.
    - **org_name** - leek organisation name (GSuite domain for organizations and GMail user id for individual users)
    - **app_name** - leek application name chosen when creating the application the first time
- Optional parameters - only required for standalone agents:
    - **app_key** - the app key generated when creating the application
    - **api_url** - Leek api url

Using the agent you can subscribe to multiple brokers like this:

```json
{
  "leek-qa": {
    "broker": "amqp://admin:admin@mq-QA//",
    "backend": null,
    "virtual_host": "/",
    "exchange": "celeryev",
    "queue": "celeryev.fanout",
    "routing_key": "#",
    "org_name": "ramp.com",
    "app_name": "leek",
    "app_env": "qa",
    "app_key": "not-secret",
    "api_url": "http://0.0.0.0:5000"
  },
 "leek-prod": {
    "broker": "amqp://admin:admin@mq-prod//",
    "backend": null,
    "virtual_host": "/",
    "exchange": "celeryev",
    "queue": "celeryev.fanout",
    "routing_key": "#",
    "org_name": "ramp.com",
    "app_name": "leek",
    "app_env": "prod",
    "app_key": "not-secret",
    "api_url": "http://0.0.0.0:5000"
  }
}
```