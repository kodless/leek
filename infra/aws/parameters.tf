locals {
  parameters = {
    ##################################
    # THESE ARE NOT SENSITIVE SECRETS
    ##################################
    # Basic
    LEEK_API_LOG_LEVEL   = var.leek_api_log_level
    LEEK_AGENT_LOG_LEVEL = var.leek_agent_log_level
    # Components
    LEEK_ENABLE_API   = var.leek_enable_api ? "true":"false"
    LEEK_ENABLE_AGENT = var.leek_enable_agent ? "true":"false"
    LEEK_ENABLE_WEB   = var.leek_enable_web ? "true":"false"
    LEEK_ENABLE_ES    = var.leek_enable_es ? "true":"false"
    # URLs
    LEEK_API_URL = "https://${var.leek_domain}:5000"
    LEEK_WEB_URL = "https://${var.leek_domain}"
    LEEK_ES_URL  = var.leek_es_url
    # Authentication
    LEEK_FIREBASE_PROJECT_ID  = var.leek_firebase_project_id
    LEEK_FIREBASE_APP_ID      = var.leek_firebase_app_id
    LEEK_FIREBASE_API_KEY     = var.leek_firebase_api_key
    LEEK_FIREBASE_AUTH_DOMAIN = var.leek_firebase_auth_domain
    # Authorization
    LEEK_API_OWNER_ORG            = var.leek_api_owner_org
    LEEK_API_WHITELISTED_ORGS     = join(",", var.leek_api_whitelisted_orgs)
  }

  parameters_envs = [
    for name, value in local.parameters:
      {
        name: name,
        value: value
      }
  ]

  secrets_envs = [
    {
      name: "LEEK_AGENT_API_SECRET",
      value: var.leek_agent_api_secret
    },
    {
      name: "LEEK_AGENT_SUBSCRIPTIONS",
      value: jsonencode(var.leek_default_agent_subscriptions)
    }
  ]

  environment = concat(local.parameters_envs, local.secrets_envs)
}
