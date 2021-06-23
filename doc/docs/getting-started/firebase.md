---
id: firebase
title: Firebase
sidebar_label: Firebase
---

Leek uses Firebase Auth and Google SSO for authentication. you can use the default Firebase settings, but it will only
work for development.

If you want to enable Firebase auth you can set `LEEK_API_ENABLE_AUTH` to `true` and set the other firebase environment 
variables:

If you are willing to deploy Leek inside a VPC as an internal tool, and you don't care about authentication/authorization
you can set `LEEK_API_ENABLE_AUTH` to `false` and skip firebase setup.

If you disable authentication/authorization there will be no user context and leek won't be able to distinguish the 
application owner from normal user, so anyone that has access to leek can delete applications, purge applications ...


![Application](/img/docs/auth.png)

To configure firebase you need to:

- Create a firebase project, follow instructions [here](https://firebase.google.com/docs/web/setup#create-firebase-project)

- Register your application and don't forget to allow your domain, follow instructions [here](https://firebase.google.com/docs/web/setup#register-app)

- Configure Leek to use your custom firebase project with [these variables](/docs/architecture/configuration#web).

