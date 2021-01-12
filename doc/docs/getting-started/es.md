---
id: es
title: Elasticsearch
sidebar_label: Elasticsearch
---

Leek uses elasticsearch to index the events, you can learn more on how Leek index events [here](http://localhost:3000/docs/architecture/indexing). 
you can use elasticsearch as a standalone instance or use the pre-installed local elasticsearch service:

- Standalone ES: a standalone ES is an ES instance running separately from Leek container. using a standalone ES is 
useful if you don't want to lose indexed data when rolling updates to Leek or if Leek crashes. don't forget to disable
local ES by setting `LEEK_ENABLE_ES` to false if you wish to use a standalone ES instance.

- Local ES: a local ES instance is a local ES running in the same container with Leek API, this is a good option if you
will not deploy Leek very often or you don't worry about losing tasks. the local ES can be enabled by setting 
`LEEK_ENABLE_ES` to true.
