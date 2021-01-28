resource "aws_alb" "_" {
  name     = local.prefix
  subnets  = var.private_subnet_ids
  internal = true

  security_groups = [
    aws_security_group.alb.id,
  ]

  tags = merge(
  local.common_tags,
  {
    "Name" = local.prefix
  },
  )
}
