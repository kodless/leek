resource "aws_iam_service_linked_role" "es" {
  aws_service_name = "es.amazonaws.com"
  description      = "AWSServiceRoleForAmazonElasticsearchService Service-Linked Role"
}

resource "aws_elasticsearch_domain" "es_vpc" {
  domain_name           = var.domain_name
  elasticsearch_version = var.es_version

  advanced_security_options {
    enabled                        = false
    internal_user_database_enabled = false
  }

  encrypt_at_rest {
    enabled    = true
    kms_key_id = var.kms_key_id
  }

  cluster_config {
    instance_type            = var.instance_type
    instance_count           = var.instance_count
    zone_awareness_enabled   = var.es_zone_awareness
    dedicated_master_enabled = false
  }

  vpc_options {
    subnet_ids         = var.private_subnets_ids
    security_group_ids = [aws_security_group.es.id]
  }

  ebs_options {
    ebs_enabled = true
    volume_type = var.ebs_volume_type
    volume_size = var.ebs_volume_size
  }

  snapshot_options {
    automated_snapshot_start_hour = var.snapshot_start_hour
  }

  log_publishing_options {
    enabled                  = true
    log_type                 = "INDEX_SLOW_LOGS"
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.index_slow.arn
  }

  log_publishing_options {
    enabled                  = true
    log_type                 = "ES_APPLICATION_LOGS"
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.node_app.arn
  }

  // TODO: please create a CNAME record pointing to domain es endpoint in your DNS
  domain_endpoint_options {
    enforce_https                   = true
    tls_security_policy             = "Policy-Min-TLS-1-2-2019-07"
    custom_endpoint_enabled         = true
    custom_endpoint                 = var.fqdn
    custom_endpoint_certificate_arn = var.cert_arn
  }

  tags       = local.common_tags
  depends_on = [aws_iam_service_linked_role.es]
}
