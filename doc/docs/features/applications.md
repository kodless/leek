---
id: applications
title: Applications
sidebar_label: Applications
---

Leek applications are basically elasticsearch index templates, Leek uses the index template to create the application
indices where the events will be indexed.

With leek you can create multiple applications and each application can accept events from different brokers after 
configuring the agent to fanout events to Leek API. 

> eg: You can create an application to monitor tasks from **qa** and **prod** rabbitmq brokers of the **project X** 
and you can have another application to monitor tasks from **qa** and **prod** rabbitmq brokers of the **project Z**.

### Create application

If there are no leek applications or you didn't create an application yet, after login, Leek will prompt you with a Modal 
to create your first Leek application:

![First time](/img/docs/first-time.png)

However, if you already created an application and you want to add another application, you can go to 
http://0.0.0.0:8000/applications and click on the green button in the top-left. 

![Applications](/img/docs/applications.png)

The user who created the application will automatically be its owner, which means only him can execute administrative 
write actions against the created application like delete, clean and purge.

### Delete application

If you don't need the application anymore, you can delete it using the red delete button and Leek will prompt a modal to 
confirm the action. beware, this action is destructive and it will delete:

- The application elasticsearch index template
- All indices related to the selected application

![Applications](/img/docs/delete-application.png)

### Purge application index

In case you want to just purge the application but don't delete it, you can click on the red purge button. this action 
is destructive but it will not delete the application and it will just:

- Delete indices related to the selected application
- Create a fresh index

![Applications](/img/docs/purge-application.png)

### Clean application index (Using delete queries)

In case you want to just clean the old tasks/workers (ES documents) from the application indices, you can click on the 
red clean button. and choose a document type to clean (task or worker), a time window and a time unit. this action is 
destructive but will only delete events older than the time window you've chosen.

![Applications](/img/docs/clean-application.png)

![Applications](/img/docs/clean-application-confirm.png)

Deleting stale events from indices comes with two advantages:

- Save storage space.
- Make search, queries and aggregations faster.

### Clean application index (Using ES hot-warm-cold-delete transitions)

- Not yet supported
