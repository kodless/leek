resource "aws_cloudwatch_log_group" "index_slow" {
  name              = "${local.prefix}-index-slow"
  tags              = local.common_tags
  retention_in_days = 365
}

resource "aws_cloudwatch_log_group" "node_app" {
  name              = "${local.prefix}-node-app"
  tags              = local.common_tags
  retention_in_days = 365
}

resource "aws_cloudwatch_log_resource_policy" "es" {
  policy_name     = local.prefix
  policy_document = data.aws_iam_policy_document.logs.json
}

data "aws_iam_policy_document" "logs" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["es.amazonaws.com"]
    }
    actions = [
      "logs:PutLogEvents",
      "logs:PutLogEventsBatch",
      "logs:CreateLogStream"
    ]
    resources = ["arn:aws:logs:*"]
  }
}
