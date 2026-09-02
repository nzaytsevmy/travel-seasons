output "github_environment_variables" {
  description = "Copy these non-secret values to the matching GitHub environment."
  value = {
    YC_FOLDER_ID              = var.folder_id
    YC_DEPLOY_SA_ID           = yandex_iam_service_account.deploy.id
    YC_REGISTRY_ID            = yandex_container_registry.api.id
    YC_RUNTIME_SA_ID          = yandex_iam_service_account.runtime.id
    YC_LOCKBOX_SECRET_ID      = yandex_lockbox_secret.api.id
    TT_ACCOUNT_CONTAINER_NAME = local.container_name
    TT_YDB_CONNECTION_STRING  = yandex_ydb_database_serverless.plans.ydb_full_endpoint
  }
}

output "api_gateway_domain" {
  value = var.runtime_ready ? yandex_api_gateway.api[0].domain : null
}

output "certificate_dns_challenge" {
  value = var.custom_domain == "" ? null : {
    name  = yandex_cm_certificate.api[0].challenges[0].dns_name
    type  = yandex_cm_certificate.api[0].challenges[0].dns_type
    value = yandex_cm_certificate.api[0].challenges[0].dns_value
  }
}

output "lockbox_secret_id" {
  value = yandex_lockbox_secret.api.id
}

output "smart_web_security_profile_id" {
  value = yandex_sws_security_profile.api.id
}
