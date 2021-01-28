data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

data "aws_ecs_task_definition" "_" {
  task_definition = aws_ecs_task_definition._.family
}
