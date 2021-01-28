resource "aws_security_group" "service" {
  name        = "${local.prefix}-service"
  description = "${local.prefix} ECS Service"
  vpc_id      = var.vpc_id

  # Frontend
  ingress {
    description     = "Allow alb to access leek frontend"
    protocol        = "TCP"
    from_port       = local.port_frontend
    to_port         = local.port_frontend
    security_groups = [aws_security_group.alb.id]
  }

  # Backend
  ingress {
    description     = "Allow alb to access leek backend"
    protocol        = "TCP"
    from_port       = local.port_backend
    to_port         = local.port_backend
    security_groups = [aws_security_group.alb.id]
  }

  # ES
  ingress {
    description     = "Allow alb to access leek ES"
    protocol        = "TCP"
    from_port       = local.port_es
    to_port         = local.port_es
    security_groups = [aws_security_group.alb.id]
  }

  # All
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.prefix}-service"
    },
  )
}

resource "aws_security_group" "alb" {
  name        = "${local.prefix}-alb"
  description = "${local.prefix}-alb Load balancer security group"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow CIDR Blocks to Backend"
    from_port   = local.port_backend
    protocol    = "tcp"
    to_port     = local.port_backend
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "Allow CIDR Blocks to Frontend"
    from_port   = 443
    protocol    = "tcp"
    to_port     = 443
    cidr_blocks = var.allowed_cidr_blocks
  }

  tags = merge(
  local.common_tags,
  {
    "Name" = "${local.prefix}-alb"
  },
  )
}
