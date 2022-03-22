---
id: infra
title: Infrastructure
sidebar_label: Infrastructure
---

To deploy leek you can use the Terraform Infrastructure as Code modules [here](https://github.com/kodless/leek/blob/master/infra)

### AWS (ECS)

To deploy leek to AWS Elastic Container Service using terraform you can use this 
[module](https://github.com/kodless/leek/blob/master/infra/aws) like this:

```hcl
module "leek" {
  source      = "git@github.com:kodless/leek.git//infra/aws"
  prefix      = "useast1-adm"
  common_tags = {}

  # ECS
  ecs_cluster_name = "cluster_name"
  fargate_cpu      = 2048
  fargate_memory   = 4096

  # VPC
  vpc_id              = "vpc-123456789"
  private_subnet_ids  = ["subnet-1234567", "subnet-7654321"]
  allowed_cidr_blocks = ["172.16.0.0/16",]

  acm_certificate_arn = "arn:aws:acm:region:account:certificate/123456789012-1234-1234-1234-12345678"

  leek_api_log_level   = "WARNING"
  leek_agent_log_level = "INFO"

  leek_enable_api   = true
  leek_enable_web   = true
  leek_enable_agent = true
  leek_enable_es    = true

  leek_domain = "leek.example.com"
  leek_es_url = "http://0.0.0.0:9200"

  leek_firebase_project_id  = "kodhive-leek"
  leek_firebase_app_id      = "1:894368938723:web:e14677d1835ce9bd09e3d6"
  leek_firebase_api_key     = "AIzaSyBiv9xF6VjDsv62ufzUb9aFJUreHQaFoDk"
  leek_firebase_auth_domain = "kodhive-leek.firebaseapp.com"

  leek_api_owner_org        = "example.com"
  leek_api_whitelisted_orgs = ["example.com", "another-example.com"]


  leek_default_agent_subscriptions = {
    default = {
      broker      = "amqp://admin:admin@mq//",
      backend     = null,
      exchange    = "celeryev",
      queue       = "leek.fanout",
      routing_key = "#",
      org_name    = "example.com",
      app_name    = "leek",
      app_env     = "prod"
    }
  }
  leek_agent_api_secret = "not-secret"
}
```

