locals {
  prefix         = "traveltribe-account-${var.environment}"
  runtime_member = "serviceAccount:${yandex_iam_service_account.runtime.id}"
  deploy_member  = "serviceAccount:${yandex_iam_service_account.deploy.id}"
  container_name = local.prefix
}

resource "yandex_iam_service_account" "runtime" {
  folder_id   = var.folder_id
  name        = "${local.prefix}-runtime"
  description = "Runtime identity for the TravelTribe account API"
}

resource "yandex_iam_service_account" "deploy" {
  folder_id   = var.folder_id
  name        = "${local.prefix}-deploy"
  description = "GitHub OIDC deploy identity for the TravelTribe account API"
}

resource "yandex_container_registry" "api" {
  folder_id = var.folder_id
  name      = local.prefix
  labels    = { app = "traveltribe-account", environment = var.environment }
}

resource "yandex_container_registry_iam_binding" "puller" {
  registry_id = yandex_container_registry.api.id
  role        = "container-registry.images.puller"
  members     = [local.runtime_member, local.deploy_member]
}

resource "yandex_container_registry_iam_binding" "pusher" {
  registry_id = yandex_container_registry.api.id
  role        = "container-registry.images.pusher"
  members     = [local.deploy_member]
}

resource "yandex_ydb_database_serverless" "plans" {
  folder_id           = var.folder_id
  name                = "${local.prefix}-plans"
  description         = "Pseudonymous TravelTribe plans and sessions"
  deletion_protection = true

  serverless_database {
    enable_throttling_rcu_limit = true
    throttling_rcu_limit        = 10
    storage_size_limit          = 1
  }
}

resource "yandex_ydb_database_iam_binding" "runtime_editor" {
  database_id = yandex_ydb_database_serverless.plans.id
  role        = "ydb.editor"
  members     = [local.runtime_member]
}

resource "yandex_lockbox_secret" "api" {
  folder_id           = var.folder_id
  name                = local.prefix
  description         = "OAuth and HMAC secrets; payload versions are added outside Terraform state"
  deletion_protection = true
  labels              = { app = "traveltribe-account", environment = var.environment }
}

resource "yandex_lockbox_secret_iam_binding" "runtime_payload" {
  secret_id = yandex_lockbox_secret.api.id
  role      = "lockbox.payloadViewer"
  members   = [local.runtime_member, local.deploy_member]
}

resource "yandex_lockbox_secret_iam_binding" "deploy_viewer" {
  secret_id = yandex_lockbox_secret.api.id
  role      = "lockbox.viewer"
  members   = [local.deploy_member]
}

resource "yandex_resourcemanager_folder_iam_member" "deploy_container_editor" {
  folder_id = var.folder_id
  role      = "serverless-containers.editor"
  member    = local.deploy_member
}

# The official deploy action currently needs this service role when it resolves
# Lockbox references. It does not grant primitive folder-wide editor access.
resource "yandex_resourcemanager_folder_iam_member" "deploy_secret_revision" {
  folder_id = var.folder_id
  role      = "functions.editor"
  member    = local.deploy_member
}

resource "yandex_iam_service_account_iam_binding" "deploy_uses_runtime" {
  service_account_id = yandex_iam_service_account.runtime.id
  role               = "iam.serviceAccounts.user"
  members            = [local.deploy_member]
}

resource "yandex_iam_workload_identity_oidc_federation" "github" {
  folder_id   = var.folder_id
  name        = "${local.prefix}-github"
  description = "Short-lived GitHub Actions credentials for ${var.github_repository}"
  audiences   = ["https://github.com/${var.github_owner}"]
  issuer      = "https://token.actions.githubusercontent.com"
  jwks_url    = "https://token.actions.githubusercontent.com/.well-known/jwks"
}

resource "yandex_iam_workload_identity_federated_credential" "github_environment" {
  service_account_id  = yandex_iam_service_account.deploy.id
  federation_id       = yandex_iam_workload_identity_oidc_federation.github.id
  external_subject_id = "repo:${var.github_repository}:environment:${var.environment}"
}

# Container revisions are owned by the GitHub deployment workflow. Terraform
# discovers the existing private container before creating its private gateway.
data "yandex_serverless_container" "api" {
  count     = var.runtime_ready ? 1 : 0
  folder_id = var.folder_id
  name      = local.container_name
}

resource "yandex_iam_service_account" "gateway" {
  folder_id   = var.folder_id
  name        = "${local.prefix}-gateway"
  description = "Invokes the private account API container through API Gateway"
}

resource "yandex_serverless_container_iam_binding" "gateway_invoker" {
  count        = var.runtime_ready ? 1 : 0
  container_id = data.yandex_serverless_container.api[0].id
  role         = "serverless-containers.containerInvoker"
  members      = ["serviceAccount:${yandex_iam_service_account.gateway.id}"]
}

resource "yandex_cm_certificate" "api" {
  count               = var.custom_domain == "" ? 0 : 1
  folder_id           = var.folder_id
  name                = "${local.prefix}-tls"
  domains             = [var.custom_domain]
  deletion_protection = true

  managed {
    challenge_type  = "DNS_CNAME"
    challenge_count = 1
  }
}

resource "yandex_sws_security_profile" "api" {
  folder_id                = var.folder_id
  cloud_id                 = var.cloud_id
  name                     = "${local.prefix}-sws"
  description              = "Edge protection for the TravelTribe account API"
  default_action           = "ALLOW"
  disallow_data_processing = true

  security_rule {
    name     = "smart-protection"
    priority = 99999

    smart_protection {
      mode = "API"
    }
  }
}

resource "yandex_api_gateway" "api" {
  count             = var.runtime_ready ? 1 : 0
  folder_id         = var.folder_id
  name              = local.prefix
  description       = "Private proxy for the TravelTribe account API"
  execution_timeout = "15"
  labels            = { app = "traveltribe-account", environment = var.environment }
  spec = templatefile("${path.module}/openapi.yaml.tftpl", {
    container_id        = data.yandex_serverless_container.api[0].id
    service_account_id  = yandex_iam_service_account.gateway.id
    security_profile_id = yandex_sws_security_profile.api.id
  })

  dynamic "custom_domains" {
    for_each = var.attach_custom_domain && var.custom_domain != "" ? [1] : []
    content {
      fqdn           = var.custom_domain
      certificate_id = yandex_cm_certificate.api[0].id
    }
  }

  depends_on = [yandex_serverless_container_iam_binding.gateway_invoker]
}
