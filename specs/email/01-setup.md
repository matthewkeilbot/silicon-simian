# Email Ingest Setup (Gmail → OpenClaw)

This is the execution playbook to turn on email ingest, with hard prerequisites called out first.

## 0) Preflight sanity check

- Verify OpenClaw is healthy:
  - `openclaw status`
  - `openclaw gateway status`
- Confirm the target mailbox/account identity for ingestion.

---

## Prerequisite 1) OAuth credentials (Google) — obtain + set

You need valid Google OAuth credentials before running Gmail webhook setup.

### 1.1 Create/verify Google Cloud project

- Use a dedicated project for this agent/environment.
- Enable APIs:
  - Gmail API
  - Cloud Pub/Sub API

### 1.2 Configure OAuth consent screen

- Configure app name/support contact.
- Add required scopes for inbound Gmail processing (least privilege).
- Add test users if app is in testing mode.

### 1.3 Create OAuth client credentials

- Create OAuth 2.0 Client ID for the environment where setup runs.
- Set authorized redirect URIs required by the OpenClaw Gmail setup flow.
- Download/save client credentials securely (do not commit to git).

### 1.4 Store credentials in OpenClaw-managed config

- Keep secrets only in OpenClaw-managed configuration/state.
- Never place raw credentials in tracked files under workspace git.
- Validate account linkage for the target mailbox.

### 1.5 Verify token acquisition

- Run auth flow once and confirm refresh/access token generation works.
- Confirm token can access Gmail history/watch endpoints for the target account.

---

## Prerequisite 2) Nginx ingress rule (webhook entrypoint)

A reachable webhook path is required for Pub/Sub push delivery.

### 2.1 Create dedicated route

- Define dedicated path (example): `/gmail-pubsub`
- Route to the OpenClaw Gmail webhook handler service/port.

### 2.2 Apply ingress constraints

- TLS termination enabled.
- Method restriction: `POST` only.
- Request body size limits and sane timeouts.
- Access logging enabled for troubleshooting.

### 2.3 Configure canonical auth controls for the inbound push hop

The public webhook path must enforce **both** of these controls:

1. **Pub/Sub OIDC JWT verification**
   - Configure the Pub/Sub push subscription with:
     - `--push-auth-service-account=<service-account-email>`
     - `--push-auth-token-audience=<expected-audience>`
   - Verify on receipt:
     - `Authorization: Bearer <JWT>` is present
     - issuer is Google (`accounts.google.com` / `https://accounts.google.com`)
     - audience matches configured value
     - token email/service account identity matches the configured push auth service account
     - token signature is valid

2. **OpenClaw/GOG push token**
   - Generate a high-entropy random token.
   - Store it in OpenClaw-managed secrets/config.
   - Pass it to OpenClaw as `--push-token <token>`.
   - Configure the Pub/Sub push endpoint created/used by setup so the Gmail receiver expects that token.

### 2.4 Distinguish the two tokens correctly

These are different controls for different hops:
- `--push-token` = protects **Pub/Sub → Gmail receiver**
- `--hook-token` = protects **Gmail receiver → OpenClaw hook**

Do not reuse or conflate them.

### 2.5 Validate external reachability

- Confirm endpoint is reachable from Google Pub/Sub.
- Confirm non-POST requests are rejected.
- Confirm invalid/missing OIDC JWT is rejected.
- Confirm invalid/missing `push-token` is rejected.

---

## 1) Generate and store required secrets

Generate two distinct high-entropy tokens:
- **push token** for `--push-token`
- **hook token** for `--hook-token`

Requirements:
- generate with a cryptographically secure source
- store in OpenClaw-managed config/secrets
- do not commit them to git
- do not reuse one token for both roles

## 2) Run OpenClaw Gmail setup

Execute with explicit auth parameters:
- `openclaw webhooks gmail setup --account <agent-email> --push-token <push-token> --hook-token <hook-token>`

Add explicit network parameters when needed:
- `--hook-url <openclaw-hook-url>`
- `--push-endpoint <public-gmail-pubsub-url>`
- `--path /gmail-pubsub`
- `--project <gcp-project-id>`
- `--subscription <pubsub-subscription-name>`
- `--topic <pubsub-topic-name>`

Expected outcome:
- Gmail watch configured
- Pub/Sub subscription configured
- Gmail receiver configured to require `push-token`
- OpenClaw hook wiring configured to require `hook-token`

## 3) Configure Pub/Sub authenticated push correctly

Ensure the Pub/Sub push subscription uses authenticated push:
- delivery type: **Push**
- push endpoint: the public `/gmail-pubsub` URL
- authentication: **enabled**
- push auth service account: dedicated service account for this push path
- push auth token audience: explicit expected audience for the webhook

Required IAM:
- Pub/Sub service agent must have `roles/iam.serviceAccountTokenCreator` on the push auth service account
- the identity creating/updating the subscription must have `iam.serviceAccounts.actAs` on that push auth service account

## 4) Start Gmail webhook worker

Run with the same auth parameters used in setup:
- `openclaw webhooks gmail run --account <agent-email> --push-token <push-token> --hook-token <hook-token>`

Optional runtime tuning:
- `--include-body`
- `--max-bytes`
- `--renew-minutes`
- `--bind`
- `--port`
- `--path`
- tailscale exposure options if used

## 5) Make it persistent

- Run as long-lived service (systemd preferred).
- Enable auto-restart on failure.
- Enable start at boot.

## 6) Validate end-to-end

- Send test email into inbox.
- Confirm OpenClaw receives/processes it.
- Confirm retries are idempotent (no duplicate processing chaos).

## 7) Security hardening checks

- Least-privilege OAuth scopes only.
- No outbound send scope in v1 unless explicitly needed.
- Secrets remain in OpenClaw-managed config.
- No sensitive/raw email leakage to untrusted channels.

## 8) Ops checks

- Monitor:
  - watch renew failures
  - auth failures
  - processing lag
- Define recovery runbook (restart worker, re-establish watch if needed).

## 9) Scheduling policy (authoritative)

For recurring operational jobs in this workflow:
- Use OpenClaw-native scheduling only: `openclaw cron ...`
- Do **not** manage this workflow via generic host cron edits.

## 10) Final acceptance

Mark complete only when:
- live ingest test passed,
- persistence configured,
- monitoring/recovery documented,
- and remaining risks/TODOs are listed.
