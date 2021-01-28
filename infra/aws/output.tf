output "security_group_id" {
  value = aws_security_group.service.id
}

output "alb" {
  value = {
    zone_id  = aws_alb._.zone_id
    dns_name = aws_alb._.dns_name
  }
}
