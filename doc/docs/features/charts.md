---
id: charts
title: Charts
sidebar_label: Charts
---

Leek provides multiple charts to give you insights about the application state.

![Monitor](/img/docs/monitor.png)

### Task states distribution:

A Pie chart with the tasks states distribution, with this chart you can have an idea about application tasks states, 
this chart is similar to basic metrics on dashboard page, but represented in a visual manner.

![States distribution](/img/docs/states-distribution.png)

### Task queues distribution:

A waffle chart with the tasks queues distribution, with this chart you can have an idea about the current state of each 
queue.

![Queues distribution](/img/docs/queues-distribution.png)

### Top 5 Executed Tasks:

A bar chart representing the 5 most executed tasks by aggregating task names and seen states for each task.

![Top 5 executed tasks](/img/docs/top-5-executed-tasks.png)

### Top 5 Slow Tasks:

A bar chart representing the 5 most slow tasks by grouping tasks by name and calculating the avg time for each group.

![Top 5 slow tasks](/img/docs/top-5-slow-tasks.png)

### Tasks over time:

A line chart representing the events over time, you can customize the chart to use different types of timestamps, for 
example if you choose `queued` as timestamp type, the chart will display the queued tasks over time and if you choose 
`failed` as timestamp type, the chart will display task failures over time.

![Tasks over time](/img/docs/tasks-over-time.png)
