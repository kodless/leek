---
id: web
title: WEB
sidebar_label: WEB
---

Leek WEB is a frontend react application built using Gatsby and served by NGINX for better performance, it's running 
alongside with Leek API. and connects to Leek API using the url in `LEEK_API_URL` environment variables.

The communication between Leek API and Leek WEB is secured with Firebase Auth JWT Token, so in order to consume Leek
API, you must be authenticated using Google SSO.

Leek WEB is integrated with Firebase so you have to configure it with Firebase using the mentioned environment 
variables [here](http://localhost:3000/docs/architecture/configuration#web)
