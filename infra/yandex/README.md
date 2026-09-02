# TravelTribe account API in Yandex Cloud

Two isolated folders are required: `staging` and `production`. The frontend
remains fully usable with `PUBLIC_ROUTE_SYNC_ENABLED=false` until every live
check below has passed.

## Bootstrap an environment

1. Copy the matching `*.tfvars.example`, replace IDs, keep `runtime_ready=false`,
   then run `terraform init`, `terraform validate`, `terraform plan -var-file=...`
   and review the plan before `terraform apply`.
2. Add one Lockbox version outside Terraform state with exactly these keys:
   `YANDEX_CLIENT_SECRET`, `SESSION_HMAC_SECRET`, `SUBJECT_HMAC_SECRET`. Generate
   both HMAC secrets independently with at least 32 random bytes. Never commit
   the payload or an authorized service-account key.
3. In the matching GitHub Environment (`staging` or `production`), add the
   non-secret Terraform outputs as variables plus:
   `YC_LOCKBOX_VERSION_ID`, `TT_FRONTEND_ORIGIN`, `TT_PUBLIC_API_ORIGIN`,
   `TT_YANDEX_CLIENT_ID`, and `TT_RUN_MIGRATIONS=true` for the first revision.
4. Run the `Account API` workflow manually. GitHub receives only a short-lived
   Yandex IAM token through OIDC; there is no long-lived cloud key in Secrets.
5. Set `runtime_ready=true` and apply Terraform again. This creates a private
   API Gateway integration protected by Smart Web Security. Confirm `/healthz`
   and `/readyz`, then switch
   `TT_RUN_MIGRATIONS=false` for later revisions.
6. For production, publish the certificate CNAME challenge from Terraform,
   wait for status `ISSUED`, set `attach_custom_domain=true`, and point
   `api.traveltribe.ru` to the API Gateway domain as required by Yandex Cloud.
7. Register the exact OAuth callback
   `https://api.traveltribe.ru/v1/auth/yandex/callback` in Yandex OAuth.

## Required live gates before enabling the frontend

- Exact CORS origin works; an unrelated Origin is rejected.
- OAuth callback, PKCE and state pass on staging and production.
- Create, edit, conflict, export, logout and account deletion pass with a fresh
  test account; YDB contains no account, plan, session or idempotency row after deletion.
- Container stays private and is reachable only through API Gateway.
- The Terraform-managed Smart Web Security profile is attached to API Gateway,
  its API mode is active and abusive traffic is blocked in a staging check. The
  application limit remains a second layer because it is per container instance.
  Smart Web Security is billed separately from API Gateway.
- A due-and-payable monthly budget is scoped to the environment folder. Use
  50%, 75% and 90% intermediate thresholds; the budget amount itself is the
  100% notification. Budget alerts warn but do not hard-stop consumption.
- Only then set repository variables `PUBLIC_ACCOUNT_API_ORIGIN` and
  `PUBLIC_ROUTE_SYNC_ENABLED=true`, merge, deploy the static site and repeat the
  user journey from a mobile viewport.

The budget request template is intentionally not auto-applied: Billing needs a
real account ID, notification user ID, chosen RUB cap and an explicit expiry.
Create it in the Billing UI or render `budget-request.json.tftpl` and call the
official `Budget.Create` API with a short-lived IAM token.
