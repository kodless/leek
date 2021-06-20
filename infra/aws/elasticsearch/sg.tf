resource "aws_security_group" "es" {
  name        = "${local.prefix}-es-sg"
  description = "Managed by Terraform"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "cidr_whitelist" {
  count             = length(var.allowed_cidr_blocks) > 0 ? 1 : 0
  from_port         = 443
  to_port           = 443
  protocol          = "TCP"
  type              = "ingress"
  security_group_id = aws_security_group.es.id
  cidr_blocks       = var.allowed_cidr_blocks
}

resource "aws_security_group_rule" "security_groups_whitelist" {
  count                    = length(var.allowed_security_group_ids)
  from_port                = 443
  to_port                  = 443
  protocol                 = "TCP"
  type                     = "ingress"
  security_group_id        = aws_security_group.es.id
  source_security_group_id = var.allowed_security_group_ids[count.index]
}
