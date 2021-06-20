output "endpoint" {
  description = "Domain-specific endpoint used to submit index, search, and data upload requests"
  value       = aws_elasticsearch_domain.es_vpc.endpoint
}

output "kibana_endpoint" {
  description = "Domain-specific endpoint used to access Kibana"
  value       = aws_elasticsearch_domain.es_vpc.kibana_endpoint
}

output "arn" {
  value = aws_elasticsearch_domain.es_vpc.arn
}
