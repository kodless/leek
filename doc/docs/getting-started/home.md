---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

To start using leek, we need to:

it is built as a docker a 
image and published to DockerHub [public repository](https://hub.docker.com/repository/docker/kodhive/leek).

This is an example on how you we can spin up a new server from Leek API Docker:


1. Setup a new firebase project to be used for authentication between WEB and API.
2. Spin up a new Leek API instance and make sure it's connected to elasticsearch db.
3. Setup up leek frontend web application using the pre-built application distribution and make sure it's connected to 
Leek API.
4. Spin up leek agent and make sure it's connected to target Brokers and Leek API defined in subscriptions descriptor 
file.
