variable "prefix" {}

variable "common_tags" {
  type = map(string)
}

# --
variable "domain_name" {
  description = "Domain name for Elasticsearch cluster"
}

variable "es_version" {
  description = "Version of Elasticsearch to deploy (default 5.1)"
  default     = "7.10"
}

# -- Resources - Compute
variable "instance_type" {
  description = "ES instance type for data nodes in the cluster (default t2.small.elasticsearch)"
  default     = "t2.small.elasticsearch"
}

variable "instance_count" {
  description = "Number of data nodes in the cluster (default 2)"
  default     = 2
}

# -- Resources - Storage
variable "ebs_volume_size" {
  description = "Optionally use EBS volumes for data storage by specifying volume size in GB (default 0)"
  default     = 0
}

variable "ebs_volume_type" {
  description = "Storage type of EBS volumes, if used (default gp2)"
  default     = "gp2"
}

# Network
variable "vpc_id" {}

variable "private_subnets_ids" {
  type = list(string)
}

variable "es_zone_awareness" {
  description = "Enable zone awareness for Elasticsearch cluster (default false)"
  default     = "false"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "CIDR whitelist for incoming requests"
  default     = []
}

variable "allowed_security_group_ids" {
  type        = list(string)
  description = "Security groups whitelist for incoming requests"
  default     = []
}

# Encryption/Backup
variable "snapshot_start_hour" {
  description = "Hour at which automated snapshots are taken, in UTC (default 0)"
  default     = 0
}

variable "kms_key_id" {
  description = "KMS Key ID used for elasticsearch domain"
}


# DNS
variable "fqdn" {
  description = "The elasticsearch domain fully qualified domain name"
}

variable "cert_arn" {
  description = "ACM Certificate ARN for the elasticsearch fqdn"
}
