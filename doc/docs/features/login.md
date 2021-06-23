---
id: login
title: Login
sidebar_label: Login
---

### Supported identity providers

For now Leek only supports Google SSO with GSuite accounts or Standard GMails accounts.

![Login](/img/docs/login.png)

If you want to enable Firebase auth you can set `LEEK_API_ENABLE_AUTH` to `true` and set the other firebase environment
variables:

If you are willing to deploy Leek inside a VPC as an internal tool, and you don't care about authentication/authorization
you can set `LEEK_API_ENABLE_AUTH` to `false` and skip firebase setup.

If you disable authentication/authorization there will be no user context and leek won't be able to distinguish the
application owner from normal user, so anyone that has access to leek can delete applications, purge applications ...

### Individual vs Organization

Leek can be used by organizations with GSuite accounts and/or individuals with Standard google accounts.

- **Organization -** For users authenticated to Leek with their GSuite accounts, Leek organization name for the logged 
users will be the GSuite domain eg: **example.com**, and leek applications created by users with **user@example.com** will be 
visible/accessible by Leek users belonging to the same GSuite organization with the same email domain ending with 
**@example.com**.

- **Individual -** For users authenticated with their standard google account (ending with **@gmail.com**), Leek 
organization name for the logged user will be the GMail user id, eg: for **john@example.com** the organization name 
is **john**, and Leek applications created by **john@example.com** will only be visible/accessible by **john@example.com**.

### Authorization and who can login to Leek?

You can control who can sign in to Leek by configuring two environment variables:

`LEEK_API_WHITELISTED_ORGS` - Specify a comma separated list of organizations whitelisted to use Leek, it should be a
domain name for GSuite organizations, and google username for standard accounts.

> Setting **LEEK_API_WHITELISTED_ORGS** to `example.com,` will make Leek accessible only to GSuite users belonging to GSuite
> organization with the domain name `example.com`, in other words only users with emails ending by `@example.com` can login
> to leek.
>
> In the other hand, setting it to `john,jane` will make sure that leek is only accessible by users with GMail accounts 
> **john@gmail.com** and **jane@gmail.com**.

![UNAUTHORIZED](/img/docs/unauthorized.png)

`LEEK_API_OWNER_ORG` - Specify the owner organization name that can manage leek, it should be the domain name for GSuite 
organizations, and google username for standard GMails account. (unlike **LEEK_API_WHITELISTED_ORGS** this parameter is 
not a list, and you should specify only one organization name).
