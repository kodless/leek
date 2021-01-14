---
id: api
title: API
sidebar_label: API
---

Leek API is a Flask Restful Application built using python and served by Gunicorn web server. it acts as a proxy between 
Leek Agent and Elasticsearch and between Leek WEB and Elasticsearch. Leek API receives events from Leek Agent and 
index them into Elasticsearch.

### Process events:

Leek API expose the `/v1/events/process` webhooks endpoint to Leek Agents, this endpoint is secured using API key 
header, for every wehbhook event this endpoint:

1. Authenticate/Authorize the request by searching for an application with the same value in `x-leek-app-key`, 
`x-leek-app-name` and `x-leek-org-name` headers, if not found will return `UNAUTHORIZED`, otherwise it will get the 
application and add it to the request context.

2. Validate the webhook events with `TaskSchema` and `WorkerSchema`.

3. Adapt the json validated events into `Task` and `Worker` objects.

3. Search in elasticsearch for tasks with similar IDs:
    - Index the new event if no document matching the new event is found.
    - Upsert the existing document with new event if a document is found and there are no conflicts.
    - If a conflict is detected, Leek resolves the conflict, merge and reindex the document.

- Go through notification pipeline and notify any event matching the rules in the trigger.

### Search events:

Leek API expose the `/v1/search` proxy endpoint to Leek WEB, this endpoint is secured using JWT tokens authorizer and
it is used for:

- Filtering tasks
- Filtering workers
- Running basic metrics aggregations
- Running issues aggregations
- Running charts aggregations

### Applications management:

Leek API expose multiple endpoints for managing applications, these endpoints are secured using JWT tokens authorizer
and used for:

- Listing applications and triggers - `permissions:all`
- Creating applications - `permissions:all`

- Creating triggers - `permissions:owner`
- Editing triggers - `permissions:owner`
- Deleting triggers - `permissions:owner`
- Deleting application - `permissions:owner`
- Purging application - `permissions:owner`
- Cleaning application - `permissions:owner`

Some actions can be called by all authenticated users and some can only be called by the application owner (the user 
who created the application the first time)

