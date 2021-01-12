---
id: tasks
title: Tasks
sidebar_label: Tasks
---

Leeks provides an awesome UI for tasks listing. it's divided into a paginated list, a time filter, attributes filter and
a task details drawer.

![Tasks](/img/docs/tasks.png)

### Tasks list

Tasks list is a paginated list of task last seen timestamp, task name, task uuid and task state. you can:

- Change page size using the bottom right combobox.
- Refresh the page with the top right button.
- Order tasks by asc|desc timestamp using the top left switch.
- Filter tasks using the time filter.
- Filter tasks using the attributes filter

### Task details

![Basic Details](/img/docs/task-details.png)

If you want to see more details about a task, you can click on a target task and a task details drawer will be opened 
with more information that includes:

- Basic details

With this tab, you can check basic task details like UUID, name, runtime, arguments and result

![Basic Details](/img/docs/task-details-basic.png)

- Time log

With this tab you can monitor task progress, when it is queued, failed, succeeded ...

![Log Details](/img/docs/task-details-log.png)

- Routing

With this tab you can check how the task is routed, to what exchange/queue the client sent the task and the worker who
processed the task

![Routing Details](/img/docs/task-details-routing.png)

- Relation

With this tab you can see task dependencies including the root task and the parent task that called the task.

![Relation Details](/img/docs/task-details-relation.png)

- Trace

With this tab you can check how many times the task was processed and failed, the exception name and the full exception
stacktrace.

![Relation Details](/img/docs/task-details-trace.png)

- Revocation

With this tab you can check if the task is expired or terminated and with what code the task terminated.

![Relation Details](/img/docs/task-details-revocation.png)

- Rejection

With this tab you can check if the task is terminated and if it is requeued or ignored.

![Relation Details](/img/docs/task-details-rejection.png)