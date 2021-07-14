data "aws_iam_policy_document" "es" {
  statement {
    effect  = "Allow"
    actions = ["es:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [
      aws_elasticsearch_domain.es_vpc.arn,
      "${aws_elasticsearch_domain.es_vpc.arn}/*"
    ]
  }
}

resource "aws_elasticsearch_domain_policy" "es" {
  domain_name     = var.domain_name
  access_policies = data.aws_iam_policy_document.es.json
}
