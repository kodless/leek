---
Title: Configuration
weight: 4
---

Leek components are configured using environment variables.

## API

| Name | Description | Default |
|:---- | ---- | ---- |
| `LEEK_ES_DOMAIN_URL` | ElasticSearch index db domain URL | None |
| `LEEK_API_LOG_LEVEL` | Log level, set it to ERROR after making sure that the agent can reach brokers and api. | INFO |
| `LEEK_API_AUTHORIZED_AUDIENCES` | A list of Firebase JWT audiences (Firebase App Name) authorized to communicate with Leek API. | None |
| `LEEK_WEB_URL` | Frontend application url, will be used when constructing slack triggers notifications. | None |
| `LEEK_API_OWNER_ORG` | The owner organization name that can manage leek, it should be domain name for gsuite organizations, and google username for personal account. | None |
| `LEEK_API_WHITELISTED_ORGS` | A list of organizations whitelisted to use Leek, it should be domain name for gsuite organizations, and google username for personal account. | None |

## Agent

| Name | Description | Default |
|:---- | ---- | ---- |
| `LEEK_AGENT_LOG_LEVEL` | Log level, set it to ERROR after making sure that the agent can reach brokers and api. | INFO |
| `LEEK_AGENT_SUBSCRIPTIONS` | A json string configuration descriptor with list of subscriptions. | None |
| `LEEK_AGENT_SUBSCRIPTIONS_FILE_PATH` | If LEEK_SUBSCRIPTIONS is not set, the subscriptions file path can be passed to the agent. | None |

## Web

| Name | Description | Default |
|:---- | ---- | ---- |
| `LEEK_API_URL` | Leek API URL in the form of https://api-host:port. | http://0.0.0.0:5000 |
| `LEEK_FIREBASE_PROJECT_ID` | Firebase project id | None |
| `LEEK_FIREBASE_APP_ID` | Firebase web application id | None |
| `LEEK_FIREBASE_API_KEY` | Firebase web application key | None |
| `LEEK_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | None |
