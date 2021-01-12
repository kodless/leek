---
id: login
title: Login
sidebar_label: Login
---

### Supported identity provider

For now Leek only supports Google SSO with GSuite accounts or standard GMails accounts.

![Login](/img/docs/login.png)

### Individual vs Organization

Leek can be used by organizations with GSuite accounts and/or individuals with standard google accounts.

- **Organization -** For users authenticated to Leek with their GSuite accounts, Leek organization name for the logged 
users will be the GSuite domain eg: **ramp.com**, and leek applications created by users with **user@ramp.com** will be 
visible/accessible by Leek users belonging to the same GSuite organization with the same email domain ending with 
**@ramp.com**.

- **Individual -** For users authenticated with their standard google account (ending with **@gmail.com**), Leek 
organization name for the logged user will be the user GMail user id, eg: for **lewis@ramp.com** the organization name 
is **lewis**, and Leek applications created by **lewis@ramp.com** will only be visible/accessible by **lewis@ramp.com**.

### Authorization and who can login to Leek?

You can control who can sign in to Leek by configuring two environment variables:

`LEEK_API_WHITELISTED_ORGS`: Specify a comma separated list of organizations whitelisted to use Leek, it should be a
domain name for GSuite organizations, and google username for personal account.

> Setting **LEEK_API_WHITELISTED_ORGS** to `ramp.com,` will make Leek accessible only to GSuite users belonging to GSuite
> organization with the domain name `ramp.com`, in other word only users with emails ending by `@ramp.com` can login
> to leek.
>
> In the other hand setting it to `lewis,jun` will make sure that leek is only accessible by users with GMail accounts 
> **lewis@gmail.com** and **jun@gmail.com**.

`LEEK_API_OWNER_ORG`: Specify the owner organization name that can manage leek, it should be domain name for GSuite 
organizations, and google username for personal account. (unlike **LEEK_API_WHITELISTED_ORGS** this parameter is not a 
list, and you should specify only one organization name).
