---
id: filters
title: Filters
sidebar_label: Filters
---

Leek provides two filters, a time filter to filter tasks by timestamp fields and attributes filters to filter tasks by 
their attributes.

![Tasks filters](/img/docs/task-filters.png)

### Time filter

![Time filter](/img/docs/time-filter.png)

You can use the time filter to filter tasks by these timestamp fields:

- **Seen**
- **Queued**
- **Received**
- **Started**
- **Succeeded**
- **Failed**
- **Retried**
- **Rejected**
- **Revoked**
- **ETA**
- **Expires**

![Time filter fields](/img/docs/time-filter-fields.png)

There are three time filter types:

- **at** - To filter the chosen timestamp field using date range.
- **past** - To filter the chosen timestamp field using past time range (15 mins ago, 2 hours ago ...). 
- **next** - To filter the chosen timestamp field using future time range (for scheduled tasks with countdown or tasks 
set to expire in future time)

![Time filter types](/img/docs/time-filter-types.png)

### Attributes filters

You can use the attributes filter to filter tasks by the following attributes:

- **uuid** - task UUID
- **name** - task name
- **state** - task state
- **routing_key** - Broker routing key
- **queue** - Broker queue name
- **worker** - Worker hostname
- **runtime** - Succeeded task runtime lte or gte
- **retries** - retries lte or gte
- **exception** - Failure exception name
- **traceback** - Failure exception traceback
- **args** - Task positional arguments
- **kwargs** - Tasks keyword arguments
- **result** - Succeeded task result
- **revocation reason** - Revocation reason (Expired|Terminated)
- **rejection outcome** - Rejection outcome (Requeued|Ignored)
- **root_id** - Root task ID
- **parent_id** - Parent task ID

![Attributes filter](/img/docs/attributes-filter.png)

