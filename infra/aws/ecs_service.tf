resource "aws_ecs_service" "_" {
  name             = local.prefix
  cluster          = var.ecs_cluster_name
  launch_type      = "FARGATE"
  desired_count    = 1
  platform_version = "1.4.0"

  task_definition = "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:task-definition/${aws_ecs_task_definition._.family}:${max(
    aws_ecs_task_definition._.revision,
    data.aws_ecs_task_definition._.revision,
  )}"

  health_check_grace_period_seconds = 120

  network_configuration {
    security_groups = [
      aws_security_group.service.id,
    ]

    subnets = var.private_subnet_ids
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.frontend.id
    container_name   = local.container_name
    container_port   = local.port_frontend
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.backend.id
    container_name   = local.container_name
    container_port   = local.port_backend
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.es.id
    container_name   = local.container_name
    container_port   = local.port_es
  }

  depends_on = [
    aws_alb_listener.backend,
    aws_alb_listener.frontend,
    aws_alb_listener.es
  ]
}
