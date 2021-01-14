---
id: docker
title: Docker
sidebar_label: Docker
---

Leek is a full stack application built using different technologies and published as a docker image to a 
[public repository](https://hub.docker.com/repository/docker/kodhive/leek) on DockerHub

To experiment with leek, you can run [this test docker-compose file](https://github.com/kodless/leek/blob/master/docker-compose-qa.yml) with:

```bash
docker-compose -f docker-compose-qa.yml build
docker-compose -f docker-compose-qa.yml up
```

```yaml
version: "2.4"
services:
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
            "virtual_host": "/",
            "exchange": "celeryev",
            "queue": "celeryev.fanout",
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

  # Just for local test!! (Test worker)
  worker:
    build:
      context: test
    environment:
      - BROKER_URL=pyamqp://admin:admin@mq:5672
    depends_on:
      mq:
        condition: service_healthy

  # Just for local test!! (Test client)
  publisher:
    build:
      context: test
    environment:
      - BROKER_URL=pyamqp://admin:admin@mq:5672
    command: >
      bash -c "python3 publisher.py"
    depends_on:
      mq:
        condition: service_healthy

  # Just for local test!! (Test broker)
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

### Before start using Leek in production

1. Setup a new firebase project to be used for authentication between WEB and API, [more info](http://localhost:3000/docs/getting-started/firebase).
2. Decide what agent mode you want to use, [standalone or local](http://localhost:3000/docs/getting-started/agent)
3. Decide what elasticsearch db mode you want to use, [standalone or local](http://localhost:3000/docs/getting-started/es).
