[<img align="right" width="200px" height="45px" src="https://cdn.buymeacoffee.com/buttons/default-yellow.png">](https://www.buymeacoffee.com/fennec)

# Leek

<h3 align="center">
    <br>
    <a href="#"><img src="https://raw.githubusercontent.com/kodless/leek/master/doc/static/img/logo.png" alt="Leek Celery Monitoring Tool" height="200" width="200"></a>
    <br>
    <span>Celery Tasks Monitoring Tool</span>
    <br>
    <span>Documentation: https://tryleek.com</span>
    <br>
  
[![Docs Build Status][docs-build-badge]][docs-build]
[![App Build Status][app-build-badge]][app-build]
[![Python 3.8][version-badge]][package]
[![pulls][pulls-badge]][dockerhub]

[![License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]
</h3>

### What is Leek?

Leek is a celery tasks monitoring tool, the main difference between Leek and other monitoring tools is that Leek can 
connect to and monitor many brokers with a single container whereas other tools can monitor only a single broker at a 
time.

Also leek supports environments branching, multiple applications, Google SSO, charts, issues monitoring, advanced 
filtering and search, indexation and persistence, slack notifications and provides an awesome UI for a better user 
experience.

Leek came to remediate the issues found with other celery monitoring tools and provide a reliable results and cool 
features to ease the process of monitoring your celery cluster, finding and respond to issues quickly.

### What Leek is not?

Leek is not a celery tasks/workers control tool and you cannot use leek to revoke/terminate/start tasks, restart your 
workers fleet, or manage your brokers. however control features could be supported with future releases.

Leek is not a package that can be installed/imported but a full stack application published as a docker image.

### Features

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



### Running a local demo

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
- A RabbitMQ broker
- Demo celery client (publisher)
- Demo celery workers (consumer)

Things to consider when running the demo:

- change app service `LEEK_API_OWNER_ORG` to your GSuite domain if leek owner is a GSuite Organisation (Organisation 
demo) or use your GMail username (the one before @gmail.com) if leek owner is an individual (Individual demo).

- change app service `LEEK_API_WHITELISTED_ORGS` to a list of GSuite organisations domains allowed to use/authenticate 
to leek using GSuite account (Organisation demo) or to a list of GMail usernames (the one before @gmail.com) to allow 
multiple GMail accounts (Individuals demo)

- After running the services with `docker-compose up`, wait for the services to start and navigate to 
http://0.0.0.0:8000.

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
```

[docs-build-badge]: https://api.netlify.com/api/v1/badges/33977c7c-42dc-44cb-8a4f-ac68c9877b6c/deploy-status
[docs-build]: https://app.netlify.com/sites/leek/deploys
[app-build-badge]: https://github.com/kodless/leek/workflows/Publish%20Leek%20Docker%20image/badge.svg
[app-build]: https://app.netlify.com/sites/leek/deploys
[version-badge]: https://img.shields.io/badge/python-3.8-blue.svg?style=flat-square
[package]: https://pypi.org/project/xxxxxxx/
[pulls-badge]: https://img.shields.io/docker/pulls/kodhive/leek.svg?style=flat-square
[dockerhub]: https://hub.docker.com/r/kodhive/leek

[license-badge]: https://img.shields.io/badge/License-Apache%202.0-blue.svg
[license]: https://github.com/kodless/leek/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: https://github.com/kodless/leek/pulls/
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/kodless/leek/blob/master/CODE_OF_CONDUCT.md

[github-watch-badge]: https://img.shields.io/github/watchers/kodless/leek.svg?style=social
[github-watch]: https://github.com/kodless/leek/watchers
[github-star-badge]: https://img.shields.io/github/stars/kodless/leek.svg?style=social
[github-star]: https://github.com/kodless/leek/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20leek%20by%20%40HamzaAdami%20https%3A%2F%2Fgithub.com%2Fkodless%2Fleek%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/kodless/leek.svg?style=social
