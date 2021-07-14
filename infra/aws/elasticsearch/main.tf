locals {
  prefix = "${var.prefix}-es-${var.domain_name}"
  common_tags = merge(var.common_tags,
    {
      "Domain" : var.domain_name
    }
  )
}
