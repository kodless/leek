---
id: docker
title: Docker
sidebar_label: Docker
---

Leek is a full stack application built using different technologies and published as a docker image to a 
[public repository](https://hub.docker.com/repository/docker/kodhive/leek) on DockerHub

Leek is a multi-services application. during docker container startup, supervisord will start as the process with pid=1
and will start the enabled service and skip the disabled ones relying on `LEEK_ENABLE_AGENT`, `LEEK_ENABLE_API`,
`LEEK_ENABLE_WEB` environment variables.

### Before start using Leek in production

1. (Optional: only if you enable firebase auth) Setup a new firebase project to be used for authentication between WEB and API, [more info](/docs/getting-started/firebase).
2. Decide what agent mode you want to use, [standalone or local](/docs/getting-started/agent)
3. Decide what elasticsearch db mode you want to use, [standalone or local](/docs/getting-started/es).


### Running a local demo with Firebase auth disabled

To experiment with leek, you can run one of these demo docker-compose files:
- [RabbitMQ Demo](https://github.com/kodless/leek/blob/master/demo/docker-compose-rmq-no-auth.yml)

```bash
curl -sSL https://raw.githubusercontent.com/kodless/leek/master/demo/docker-compose-rmq-no-auth.yml > docker-compose.yml
docker-compose up
```

- [Redis Demo](https://github.com/kodless/leek/blob/master/demo/docker-compose-redis-no-auth.yml)

```bash
curl -sSL https://raw.githubusercontent.com/kodless/leek/master/demo/docker-compose-redis-no-auth.yml > docker-compose.yml
docker-compose up
```

This is an example of a demo, that includes 4 services:

- Leek main application
- A RabbitMQ or Redis broker
- An elasticsearch node
- Demo celery client (publisher)
- Demo celery workers (consumer)

- After running the services with `docker-compose up`, wait for the services to start and navigate to 
http://localhost:8000.

- Create an application with the same name as in `LEEK_AGENT_SUBSCRIPTIONS`, which is `leek`.

- Enjoy the demo

```yaml
version: "2.4"
services:
  # Main app
  app:
    image: kodhive/leek
    environment:
      # General
      - LEEK_API_LOG_LEVEL=INFO
      - LEEK_AGENT_LOG_LEVEL=INFO
      # Components
      - LEEK_ENABLE_API=true
      - LEEK_ENABLE_AGENT=true
      - LEEK_ENABLE_WEB=true
      # URLs
      - LEEK_API_URL=http://0.0.0.0:5000
      - LEEK_WEB_URL=http://0.0.0.0:8000
      - LEEK_ES_URL=http://es01:9200
      # Authentication
      - LEEK_API_ENABLE_AUTH=false
      # Subscriptions
      - |
        LEEK_AGENT_SUBSCRIPTIONS=
        {
          "leek-prod": {
            "broker": "amqp://admin:admin@mq//",
            "backend": null,
            "exchange": "celeryev",
            "queue": "leek.fanout",
            "routing_key": "#",
            "org_name": "mono",
            "app_name": "leek",
            "app_env": "prod",
            "prefetch_count": 1000,
            "concurrency_pool_size": 3
          }
        }
      - LEEK_AGENT_API_SECRET=not-secret
    ports:
      - 5000:5000
      - 8000:8000
    depends_on:
      mq:
        condition: service_healthy

  # Just for local demo!! (Test worker)
  worker:
    image: kodhive/leek-demo
    environment:
      - BROKER_URL=pyamqp://admin:admin@mq:5672
    depends_on:
      mq:
        condition: service_healthy

  # Just for local demo!! (Test client)
  publisher:
    image: kodhive/leek-demo
    environment:
      - BROKER_URL=pyamqp://admin:admin@mq:5672
    command: >
      bash -c "python3 publisher.py"
    depends_on:
      mq:
        condition: service_healthy

  # Just for local demo!! (Test broker)
  mq:
    image: rabbitmq:3.8.9-management-alpine
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin
      - "RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS=-rabbit log [{console,[{level,error}]}]"
    ports:
      - 15672:15672
      - 5672:5672
    healthcheck:
      test: [ "CMD", "nc", "-z", "localhost", "5672" ]
      interval: 2s
      timeout: 4s
      retries: 20

  # Just for local development!! (Test index db)
  es01:
    image: elasticsearch:7.10.1
    container_name: es01
    environment:
      - node.name=es01
      - cluster.name=es-docker-cluster
      - cluster.initial_master_nodes=es01
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    command: ["elasticsearch", "-Elogger.level=ERROR"]
    healthcheck:
      test: ["CMD-SHELL", "curl --silent --fail localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 30s
      retries: 3
    ulimits:
      memlock:
        soft: -1
        hard: -1
    ports:
      - 9200:9200
```


### Running a local demo with auth enabled

To experiment with leek, you can run one of these demo docker-compose files:
- [RabbitMQ Demo](https://github.com/kodless/leek/blob/master/demo/docker-compose-rmq.yml)

```bash
curl -sSL https://raw.githubusercontent.com/kodless/leek/master/demo/docker-compose-rmq.yml > docker-compose.yml
docker-compose up
```

- [Redis Demo](https://github.com/kodless/leek/blob/master/demo/docker-compose-redis.yml)

```bash
curl -sSL https://raw.githubusercontent.com/kodless/leek/master/demo/docker-compose-redis.yml > docker-compose.yml
docker-compose up
```

This is an example of a demo, that includes 4 services:

- Leek main application
- A RabbitMQ or Redis broker
- An elasticsearch node
- Demo celery client (publisher)
- Demo celery workers (consumer)

Things to consider when running the demo:

- change app service `LEEK_API_OWNER_ORG` to your GSuite domain if leek owner is a GSuite Organisation (Organisation
  demo) or use your GMail username (the one before @gmail.com) if leek owner is an individual (Individual demo).

- change app service `LEEK_API_WHITELISTED_ORGS` to a list of GSuite organisations domains allowed to use/authenticate
  to leek using GSuite account (Organisation demo) or to a list of GMail usernames (the one before @gmail.com) to allow
  multiple GMail accounts (Individuals demo)

- After running the services with `docker-compose up`, wait for the services to start and navigate to
  http://localhost:8000.

- Create an application with the same name as in `LEEK_AGENT_SUBSCRIPTIONS`, which is `leek`.

- Enjoy the demo

```yaml
version: "2.4"
services:
  # Main app
  app:
    image: kodhive/leek
    environment:
      # General
      - LEEK_API_LOG_LEVEL=INFO
      - LEEK_AGENT_LOG_LEVEL=INFO
      # Components
      - LEEK_ENABLE_API=true
      - LEEK_ENABLE_AGENT=true
      - LEEK_ENABLE_WEB=true
      # URLs
      - LEEK_API_URL=http://0.0.0.0:5000
      - LEEK_WEB_URL=http://0.0.0.0:8000
      - LEEK_ES_URL=http://es01:9200
      # Authentication
      - LEEK_FIREBASE_PROJECT_ID=kodhive-leek
      - LEEK_FIREBASE_APP_ID=1:894368938723:web:e14677d1835ce9bd09e3d6
      - LEEK_FIREBASE_API_KEY=AIzaSyBiv9xF6VjDsv62ufzUb9aFJUreHQaFoDk
      - LEEK_FIREBASE_AUTH_DOMAIN=kodhive-leek.firebaseapp.com
      # Authorization
      - LEEK_API_OWNER_ORG=example.com
      - LEEK_API_WHITELISTED_ORGS=example.com,
      # Subscriptions
      - |
        LEEK_AGENT_SUBSCRIPTIONS=
        {
          "leek-prod": {
            "broker": "amqp://admin:admin@mq//",
            "backend": null,
            "exchange": "celeryev",
            "queue": "leek.fanout",
            "routing_key": "#",
            "org_name": "example.com",
            "app_name": "leek",
            "app_env": "prod",
            "prefetch_count": 1000,
            "concurrency_pool_size": 3
          }
        }
      - LEEK_AGENT_API_SECRET=not-secret
    ports:
      - 5000:5000
      - 8000:8000
    depends_on:
      mq:
        condition: service_healthy

  # Just for local demo!! (Test worker)
  worker:
    image: kodhive/leek-demo
    environment:
      - BROKER_URL=pyamqp://admin:admin@mq:5672
    depends_on:
      mq:
        condition: service_healthy

  # Just for local demo!! (Test client)
  publisher:
    image: kodhive/leek-demo
    environment:
      - BROKER_URL=pyamqp://admin:admin@mq:5672
    command: >
      bash -c "python3 publisher.py"
    depends_on:
      mq:
        condition: service_healthy

  # Just for local demo!! (Test broker)
  mq:
    image: rabbitmq:3.8.9-management-alpine
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin
      - "RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS=-rabbit log [{console,[{level,error}]}]"
    ports:
      - 15672:15672
      - 5672:5672
    healthcheck:
      test: [ "CMD", "nc", "-z", "localhost", "5672" ]
      interval: 2s
      timeout: 4s
      retries: 20

  # Just for local development!! (Test index db)
  es01:
    image: elasticsearch:7.10.1
    container_name: es01
    environment:
      - node.name=es01
      - cluster.name=es-docker-cluster
      - cluster.initial_master_nodes=es01
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    command: ["elasticsearch", "-Elogger.level=ERROR"]
    healthcheck:
      test: ["CMD-SHELL", "curl --silent --fail localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 30s
      retries: 3
    ulimits:
      memlock:
        soft: -1
        hard: -1
    ports:
      - 9200:9200
```
