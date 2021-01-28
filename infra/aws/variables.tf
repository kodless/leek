variable "prefix" {
  type        = string
  description = "Resources names prefix"
}

variable "common_tags" {
  type        = map(string)
  description = "Resources common tags"
}

# ECS
variable "ecs_cluster_name" {
  type        = string
  description = "ECS cluster name"
}

variable "fargate_cpu" {
  type        = number
  default     = 2048
  description = "2gb is recommended if you enable all leek components in same container"
}

variable "fargate_memory" {
  type        = number
  default     = 4096
  description = "4gb is recommended if you enable all leek components in same container"
}

# VPC
variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "A list of private subnet ids on the VPC"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "Allowed cidr blocks to access Leek ALB"
}

# DNS
variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for ALB HTTPS listeners"
}

# LOGGING
variable "leek_api_log_level" {
  default     = "INFO"
  description = "API log level"
}
variable "leek_agent_log_level" {
  default     = "INFO"
  description = "Agent log level"
}

# COMPONENTS
variable "leek_enable_api" {
  default     = true
  description = "Whether Enable API component"
}
variable "leek_enable_web" {
  default     = true
  description = "Whether Enable WEB component"
}
variable "leek_enable_agent" {
  default     = true
  description = "Whether Enable Local Agent component"
}
variable "leek_enable_es" {
  default = true
  description = "Whether Enable Local ES component"
}

# DNS
variable "leek_domain" {
  type        = string
  description = "Leek FQDN already configured with ACM, eg: leek.example.com"
}

variable "leek_es_url" {
  type        = string
  default     = "http://0.0.0.0:9200"
  description = "Elasticsearch URL, don't specify when using local ES service"
}

# AUTHENTICATION
variable "leek_firebase_project_id" {
  type        = string
  description = "Firebase project ID"
}
variable "leek_firebase_app_id" {
  type        = string
  description = "Firebase application ID"
}
variable "leek_firebase_api_key" {
  type        = string
  description = "Firebase API key"
}
variable "leek_firebase_auth_domain" {
  type        = string
  description = "Firebase auth domain"
}

# AUTHORIZATION
variable "leek_api_owner_org" {
  type        = string
  description = "Leek owner organization, a domain for GSuite org and GMail username for standard google accounts. eg: example.com"
}
variable "leek_api_whitelisted_orgs" {
  type        = list(string)
  description = "Leek whitelisted organizations, domains list for GSuite org and GMail username list for standard google accounts: eg: [example.com, alt.com]"
}

# SUBSCRIPTIONS
variable "leek_default_agent_subscriptions" {
  type        = "map"
  description = "Agent/Brokers subscriptions map"
}
variable "leek_agent_api_secret" {
  type        = string
  description = "Leek Agent/API secret when using local agent"
}

