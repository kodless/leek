---
id: es
title: Elasticsearch
sidebar_label: Elasticsearch
---

Leek uses elasticsearch to index the events, you can learn more on how Leek index events [here](/docs/architecture/indexing). 
you can use elasticsearch as a standalone instance or use the pre-installed local elasticsearch service:

- **Standalone ES** - a standalone ES is an ES instance running separately from Leek container. using a standalone ES is 
useful if you don't want to lose indexed data when rolling updates to Leek or if Leek crashes. disable
local ES by setting `LEEK_ENABLE_ES` to false if you wish to use a standalone ES instance.

- **Local ES** - a local ES instance is a local ES running in the same container with Leek API, this is a good option 
if you will not deploy Leek very often or you don't worry about losing events data. the local ES can be enabled by s
etting  `LEEK_ENABLE_ES` to true.

> Starting from leek version 0.4.0 there will be no support for local elasticsearch even if you set `LEEK_ENABLE_ES` to 
> true, and if you still want a local elasticsearch you can use the official elasticsearch docker image to run a 
> sidecar container. this decision is made to improve leek docker image size and also to encourage the use of a managed 
> and well configured elasticsearch instances.
