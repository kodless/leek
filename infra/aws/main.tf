locals {
  prefix         = "${var.prefix}-leek"
  common_tags    = var.common_tags
  container_name = "app"

  # Ports
  port_backend  = 5000
  port_frontend = 8000
  port_es       = 9200
}
