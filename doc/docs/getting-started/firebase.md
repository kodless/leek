---
id: firebase
title: Firebase
sidebar_label: Firebase
---

Leek uses Firebase Auth and Google SSO for authentication. you can use the default Firebase production but it will only
work for development.

![Application](/img/docs/auth.png)

To configure firebase you need to:

- Create a firebase project, follow instructions [here](https://firebase.google.com/docs/web/setup#create-firebase-project)

- Register your application and don't forget to allow you domain, follow instructions [here](https://firebase.google.com/docs/web/setup#register-app)

- Configure Leek to use your custom firebase project with [these variables](http://localhost:3000/docs/architecture/configuration#web).

