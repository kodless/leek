resource "aws_iam_role" "_" {
  name               = local.prefix
  description        = "${local.prefix} ECS Execution role"
  assume_role_policy = data.aws_iam_policy_document.assume.json

  force_detach_policies = true
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = [
      "sts:AssumeRole",
    ]

    principals {
      type = "Service"

      identifiers = [
        "ecs-tasks.amazonaws.com",
      ]
    }
  }
}

resource "aws_iam_policy" "_" {
  name        = local.prefix
  path        = "/"
  description = "${local.prefix} Policy"
  policy      = data.aws_iam_policy_document.policy.json
}

data "aws_iam_policy_document" "policy" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:PutLogEventsBatch",
    ]

    resources = [
      "arn:aws:logs:*"
    ]
  }
}

resource "aws_iam_role_policy_attachment" "_" {
  policy_arn = aws_iam_policy._.arn
  role       = aws_iam_role._.name
}
