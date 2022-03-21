---
id: agent
title: Agent
sidebar_label: Agent
---

Leek agent is a simple python client that connects to brokers and fanout events to Leek API. the communication between 
the agent and the brokers is done over AMQP protocol using the package Kombu. and the concurrency to support multiple 
brokers is achieved with GEvent.

![Agent](/img/docs/agent-page.png)

### Leek agents bootsteps

- The agent starts by loading the subscriptions configuration from environment variable.
- Performs a healthcheck against the brokers and APIs in each subscription.
- For each subscription, the agent spawn a GEvent Greenlet and wait for all Greenlets to exit.
- Each GreenLet connects to the broker and fanout received messages to Leek API.

### Leek agent modes

Depending on your use case, the agent can be run as a standalone agent or as a local agent:

1. **Local agent -** Leek ships with a local agent which can be run alongside leek API, the communication between Leek API 
and Leek Agent is internal and secured using the shared secret from `LEEK_AGENT_API_SECRET`. Leek does not use the 
application api key generated when the application is created and configured in subscriptions environment variable but 
will always fallback to the `LEEK_AGENT_API_SECRET` when using local agent, to enable local agent you can set both 
`LEEK_ENABLE_API` and `LEEK_ENABLE_AGENT` to true on the same container.

When using a local agent you can control it using the agent control page at http://0.0.0.0:8000/agent, the agent is 
controlled using `supervisor` through RPC interface methods, you can:

- Get agent current status
- Stop agent
- Start agent
- Restart agent (in case you want to reload dynamic subscriptions)

![Agent](/img/docs/agent-process.png)

2. **Standalone agent -** if you don't have network access to brokers because they live in another infrastructure that does 
not belong to you. you can instruct infrastructure owners to use the standalone Leek agent to fanout events to your Leek 
API. the communication will be secured between the standalone agent and the API using an API KEY defined in the 
subscriptions environment variable. you can enable standalone agent by setting `LEEK_ENABLE_AGENT` to true and disable 
all other services by setting `LEEK_ENABLE_API`, `LEEK_ENABLE_WEB` to false.

> You cannot control a standalone agent using the agent page at http://0.0.0.0:8000/agent as it lives in another 
> instance

### Leek subscriptions

Leek subscriptions is a json object with one or more subscription, each subscription has a unique name and a set of 
parameters to connect to the brokers and APIs.

![Agent](/img/docs/agent.png)

- Required parameters:
    - **broker** - the broker url (Redis and RabbitMQ are supported)
    - **backend** - the result backend url
    - **exchange** - should be the same as the exchange used by clients and workers defined by `event_exchange`  [Learn More](https://docs.celeryproject.org/en/stable/userguide/configuration.html#event-exchange)
    - **queue** - the queue used to store the events
    - **routing_key** - should be `#` for now.
    - **org_name** - leek organisation name (GSuite domain for organizations and GMail user id for individual users)
    - **app_name** - leek application name chosen when creating the application the first time

- Optional parameters - will fallback to defaults if not set:
  - **prefetch_count** - used to specify how many messages are being sent at the same time from the broker to agent. it
    defaults to 1,000 and should be between 1,000 and 10,000.
  - **concurrency_pool_size** - The gevent pool size, or the number green threads that the agent can spawn for the 
    current subscription to send events concurrently to Leek API.
  - **batch_max_size_in_mb** - The maximum batch size in MB before Leek agent sends the events batch to Leek API. It 
    defaults to 1 and should be <= 10.
  - **batch_max_number_of_messages** - The maximum number of messages in a batch before Leek agent sends the batch to 
    Leek API. It defaults to **prefetch_count** and if specified it should be less than **prefetch_count**
  - **batch_max_window_in_seconds** - If **batch_max_number_of_messages** and **batch_max_size_in_mb** are not fulfilled 
    during the **batch_max_window_in_seconds**, Leek agent sends the batch to Leek API to avoid keeping events for a long 
    time in the agent, This is useful for environments where the messages rate is too low. It defaults to 5 seconds and 
    should be <= 20

- Optional parameters - only required for standalone agents:
    - **app_key** - the app key generated when creating the application
    - **api_url** - Leek api url

### Static subscriptions

You can configure the agent statically with `LEEK_AGENT_SUBSCRIPTIONS` environment variables. the example bellow 
illustrate how you can subscribe to multiple brokers:

```json
[
  {
    "broker": "amqp://admin:admin@mq-QA//",
    "backend": null,
    "exchange": "celeryev",
    "queue": "leek.fanout",
    "routing_key": "#",
    "org_name": "example.com",
    "app_name": "leek",
    "app_env": "qa",
    "app_key": "not-secret",
    "api_url": "http://0.0.0.0:5000",
    "prefetch_count": 1000,
    "concurrency_pool_size": 2,
    "batch_max_size_in_mb": 1,
    "batch_max_number_of_messages": 1000,
    "batch_max_window_in_seconds": 5
  },
  {
    "broker": "amqp://admin:admin@mq-prod//",
    "backend": null,
    "exchange": "celeryev",
    "queue": "leek.fanout",
    "routing_key": "#",
    "org_name": "example.com",
    "app_name": "leek",
    "app_env": "prod",
    "app_key": "not-secret",
    "api_url": "http://0.0.0.0:5000",
    "prefetch_count": 1000,
    "concurrency_pool_size": 2,
    "batch_max_size_in_mb": 1,
    "batch_max_number_of_messages": 1000,
    "batch_max_window_in_seconds": 5
  }
]
```

> Stringify the json object before storing it to `LEEK_AGENT_SUBSCRIPTIONS`

### Dynamic subscriptions

Leek also supports dynamic subscriptions, you can go to agent page at http://0.0.0.0:8000/agent to manage subscriptions.

When using dynamic agent, you can add subscriptions without needing to restart leek, also you can skip setting 
`LEEK_AGENT_SUBSCRIPTIONS` environment variable, also mount a volume to docker container `/opt` so the dynamic 
subscriptions can be persisted when leek is restarted.

With dynamic agent you can:

- List existing subscriptions.

![Add subscriptions](/img/docs/subscriptions-list.png)

- Add new subscription.

To add a new subscription you can click on the green add button on top-right of subscriptions list, and specify the
broker parameters.

Before adding the agent Leek will verify if the broker is reachable, and the broker credentials are valid, if not the
operation will fail.

![Add subscriptions](/img/docs/subscriptions-add.png)

- Delete a subscription.

To delete a subscription you can click on delete button of target subscription and restart the agent with Restart button.

> After altering subscriptions, an agent restart action is required in order for the new subscriptions config to take 
effect, you can restart agent by clicking on restart button on agent control page.
