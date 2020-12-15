---
Title: API
weight: 8
---

Leek API is a Flask Restful Application and served with Gunicorn web server. it is built as a docker image and published 
to DockerHub [public repository](https://hub.docker.com/repository/docker/kodhive/leek).

This is an example on how you we can spin up a new server from Leek API Docker:

```yaml
version: "2.4"
services:
  api:
    image: kodhive/leek
    command: make run_gunicorn
    environment:
      - LEEK_API_LOG_LEVEL=INFO
      - LEEK_ES_DOMAIN_URL=http://es01:9200
      - LEEK_WEB_URL=http://0.0.0.0:8000
      - LEEK_API_AUTHORIZED_AUDIENCES=kodhive-leek
      - LEEK_API_OWNER_ORG=ramp.com
      - LEEK_API_WHITELISTED_ORGS=ramp.com,leek.com
    ports:
      - 5000:5000
    healthcheck:
      test: [ "CMD", "nc", "-z", "localhost", "5000" ]
      interval: 2s
      timeout: 4s
      retries: 20
    depends_on:
      es01:
        condition: service_healthy

  # Just for local development!! (Test index db)
  es01:
    image: elasticsearch:7.8.0
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