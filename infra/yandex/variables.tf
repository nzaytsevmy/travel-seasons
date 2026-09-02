variable "folder_id" {
  description = "Yandex Cloud folder for this isolated environment."
  type        = string
}

variable "cloud_id" {
  description = "Yandex Cloud ID, used by the budget template and outputs."
  type        = string
}

variable "environment" {
  description = "Environment name: staging or production."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "github_repository" {
  description = "GitHub repository in owner/name form."
  type        = string
  default     = "nzaytsevmy/travel-seasons"
}

variable "github_owner" {
  description = "GitHub owner used as the OIDC audience."
  type        = string
  default     = "nzaytsevmy"
}

variable "runtime_ready" {
  description = "Set true only after the first container revision exists."
  type        = bool
  default     = false
}

variable "custom_domain" {
  description = "API domain. Keep empty in staging or before DNS is ready."
  type        = string
  default     = ""
}

variable "attach_custom_domain" {
  description = "Set true only after the managed certificate status is ISSUED."
  type        = bool
  default     = false
}
