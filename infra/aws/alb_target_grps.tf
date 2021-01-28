resource "aws_alb_target_group" "frontend" {
  name                 = "${local.prefix}-frontend"
  port                 = local.port_frontend
  vpc_id               = var.vpc_id
  protocol             = "HTTP"
  target_type          = "ip"
  deregistration_delay = 10

  health_check {
    path              = "/"
    protocol          = "HTTP"
    port              = local.port_frontend
    matcher           = 200
    healthy_threshold = 2
    interval          = 5
    timeout           = 4
  }

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.prefix}-frontend"
    },
  )
}

resource "aws_alb_target_group" "backend" {
  name                 = "${local.prefix}-backend"
  port                 = local.port_backend
  vpc_id               = var.vpc_id
  protocol             = "HTTP"
  target_type          = "ip"
  deregistration_delay = 10

  health_check {
    path              = "/v1/manage/hc"
    protocol          = "HTTP"
    port              = local.port_backend
    matcher           = 200
    healthy_threshold = 2
    interval          = 5
    timeout           = 4
  }

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.prefix}-backend"
    },
  )
}

resource "aws_alb_target_group" "es" {
  name                 = "${local.prefix}-es"
  port                 = local.port_es
  vpc_id               = var.vpc_id
  protocol             = "HTTP"
  target_type          = "ip"
  deregistration_delay = 10

  health_check {
    path              = "/_cluster/health"
    protocol          = "HTTP"
    port              = local.port_es
    matcher           = 200
    healthy_threshold = 2
    interval          = 5
    timeout           = 4
  }

  tags = merge(
  local.common_tags,
  {
    "Name" = "${local.prefix}-es"
  },
  )
}
