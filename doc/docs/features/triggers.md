---
id: triggers
title: Triggers
sidebar_label: Triggers
---

Leek notification trigger is a set of rules that send a notification message to Slack when the rules are satisfied,
these rules are stored in the application index template as a json array.

![Applications](/img/docs/create-triggers.png)

Every time Leek receives events, it will index them first and after a successful indexation the events are sent to a
notification pipeline, the pipeline will get the fanout triggers from the related application and for each trigger it 
will check if the indexed events matches the rules on the trigger, The rules can be:

- **enabled**: trigger enabled field is a boolean filed to control activation and deactivation of the trigger, if the 
trigger is disabled the pipeline will be skipped, otherwise it will continue to test other matchers.

- **envs**: an array field indicating the list of environments where this trigger rule will be matched. if the indexed 
events came from a different environment than the defined list, the pipeline will be skipped, otherwise the pipeline 
will move to the next rule. an empty envs array means a wildcard and events with any env will be considered matched 
against this rule. this rule can be useful if you are interested in receiving notifications just for some environments
like production. 

- **states**: an array field indicating the list of states when this trigger rule will be matched, if any of the indexed 
events with a different state that the states defined in the list, the pipeline will be skipped, otherwise the pipeline
will move the the next rule. the same as envs rules, an empty states array means a wildcard and events with any state 
will be considered matched against this rule. this rule can be useful if you want to receive notification for events 
with critical states like FAILED, CRITICAL and RECOVERED states.

- **exclusions**: an array filed holding a list of regular expressions the trigger will apply against tasks names, if
any of the indexed tasks match this rule the pipeline will exclude it and will not be notified, otherwise the pipeline 
will move to the next rule - only one of exclusions|inclusions can be specified. this rule can be useful if you are not 
interested in receiving noisy notification for tasks that have have a tendency to fail very often.

- **inclusions**: an array field holding a list of regular expressions the trigger will apply against tasks names, if 
any of the indexed tasks match this rule the pipeline will continue to next rule, otherwise this rule will not be 
matched and the pipeline will be skipped. an empty inclusions array means a wildcard and tasks with any name will be 
considered matched against this rule. this rule is useful if you are interested in receiving notifications just for a 
subset of tasks, or if you want to route tasks notification to different channels depending on their names or package 
name.

- **runtime_upper_bound**: a number field representing the task execution runtime upper bound, the runtime attribute is
only available with succeeded tasks. if any of the indexed succeeded tasks exceeds the runtime upper bound this rule 
will be matched and the pipeline will add an extra note on notification message indicating that the tasks took a long 
time to finish. this can be to monitor critical tasks latencies.

### Trigger Example

In the example bellow Leek will send a notification message to slack if:

- The task is a production task.

- The task state is one of SUCCEEDED | RECOVERED | CRITICAL.

- If the task is SUCCEEDED | RECOVERED only notify if its runtime exceeds 20 seconds

- Do not notify tasks with the name starting by `tasks.test.`


![Create a Trigger](/img/docs/create-trigger.png)


### Triggers List

After creating the trigger, it will be added to triggers list as shown bellow:

![Triggers List](/img/docs/triggers-list.png)

### Slack notification

This is an example of Leek slack notification

![Slack](/img/docs/slack.png)