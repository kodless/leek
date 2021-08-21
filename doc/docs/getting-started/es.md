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


## Caveats

### Virtual memory

Elasticsearch uses a `mmapfs` directory by default to store its indices. The default operating system limits on mmap 
counts is likely to be too low, which may result in out of memory exceptions.

On Linux, you can increase the limits by running the following command as `root`:

```bash
sysctl -w vm.max_map_count=262144
```

To set this value permanently, update the `vm.max_map_count` setting in `/etc/sysctl.conf`. To verify after rebooting, 
run `sysctl vm.max_map_count`.

The RPM and Debian packages will configure this setting automatically. No further configuration is required.

If you use docker to take effect you should restart it:

```bash
systemctl restart docker
```