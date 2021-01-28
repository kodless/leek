---
id: docker
title: Docker
sidebar_label: Docker
---

Leek is a full stack application built using different technologies and published as a docker image to a 
[public repository](https://hub.docker.com/repository/docker/kodhive/leek) on DockerHub

Leek is a multi-services application. during docker container startup, supervisord will start as the process with pid=1
and will start the enabled service and skip the disabled ones relying on `LEEK_ENABLE_AGENT`, `LEEK_ENABLE_AGENT`, 
`LEEK_ENABLE_WEB`, `LEEK_ENABLE_ES` environment variables.

### Before start using Leek in production

1. Setup a new firebase project to be used for authentication between WEB and API, [more info](http://localhost:3000/docs/getting-started/firebase).
2. Decide what agent mode you want to use, [standalone or local](http://localhost:3000/docs/getting-started/agent)
3. Decide what elasticsearch db mode you want to use, [standalone or local](http://localhost:3000/docs/getting-started/es).


### Quick local demo

To experiment with leek, you can run [this demo docker-compose file](https://github.com/kodless/leek/blob/master/docker-compose-demo.yml) with:

```bash
docker-compose -f docker-compose-demo.yml up
```

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
      - LEEK_ENABLE_ES=true
      # URLs
      - LEEK_API_URL=http://0.0.0.0:5000
      - LEEK_WEB_URL=http://0.0.0.0:8000
      - LEEK_ES_URL=http://0.0.0.0:9200
      # Authentication
      - LEEK_FIREBASE_PROJECT_ID=kodhive-leek
      - LEEK_FIREBASE_APP_ID=1:894368938723:web:e14677d1835ce9bd09e3d6
      - LEEK_FIREBASE_API_KEY=AIzaSyBiv9xF6VjDsv62ufzUb9aFJUreHQaFoDk
      - LEEK_FIREBASE_AUTH_DOMAIN=kodhive-leek.firebaseapp.com
      # Authorization
      - LEEK_API_AUTHORIZED_AUDIENCES=kodhive-leek
      - LEEK_API_OWNER_ORG=example.com
      - LEEK_API_WHITELISTED_ORGS=example.com,
      # Subscriptions
      - |
        LEEK_AGENT_SUBSCRIPTIONS=
        {
          "default": {
            "broker": "amqp://admin:admin@mq//",
            "backend": null,
            "exchange": "celeryev",
            "queue": "leek.fanout",
            "routing_key": "#",
            "org_name": "example.com",
            "app_name": "leek",
            "app_env": "prod"
          }
        }
      - LEEK_AGENT_API_SECRET=not-secret
    ports:
      - 5000:5000
      - 8000:8000
      - 9200:9200
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
    volumes:
      - ./test/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
    ports:
      - 15672:15672
      - 5672:5672
    healthcheck:
      test: [ "CMD", "nc", "-z", "localhost", "5672" ]
      interval: 2s
      timeout: 4s
      retries: 20
```
