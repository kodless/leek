data "template_file" "_" {
  template = file("${path.module}/task.json.tpl")

  vars = {
    AWS_REGION     = data.aws_region.current.name
    AWS_LOG_GROUP  = aws_cloudwatch_log_group._.name
    CONTAINER_NAME = local.container_name
    ENVIRONMENT    = jsonencode(local.environment)
    IMAGE          = "kodhive/leek"
  }
}

resource "aws_ecs_task_definition" "_" {
  family                   = local.prefix
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE", ]

  cpu                = var.fargate_cpu
  memory             = var.fargate_memory
  task_role_arn      = aws_iam_role._.arn
  execution_role_arn = aws_iam_role._.arn

  container_definitions = data.template_file._.rendered
}
