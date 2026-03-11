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

### 2.3 Add request integrity/auth controls

Use one or both:
- Pub/Sub OIDC JWT verification
- shared push token validation

Recommended: both (defense in depth).

### 2.4 Validate external reachability

- Confirm endpoint is reachable from Google Pub/Sub.
- Confirm non-POST and invalid-auth requests are rejected.

---

## 1) Run OpenClaw Gmail setup

- Execute:
  - `openclaw webhooks gmail setup --account <agent-email>`
- Expected outcome:
  - Gmail watch configured
  - Pub/Sub subscription configured
  - OpenClaw hook wiring created

## 2) Start Gmail webhook worker

- Run:
  - `openclaw webhooks gmail run`
- Optional runtime tuning:
  - `--include-body`
  - `--max-bytes`
  - `--renew-minutes`
  - bind/path/hook options

## 3) Make it persistent

- Run as long-lived service (systemd preferred).
- Enable auto-restart on failure.
- Enable start at boot.

## 4) Validate end-to-end

- Send test email into inbox.
- Confirm OpenClaw receives/processes it.
- Confirm retries are idempotent (no duplicate processing chaos).

## 5) Security hardening checks

- Least-privilege OAuth scopes only.
- No outbound send scope in v1 unless explicitly needed.
- Secrets remain in OpenClaw-managed config.
- No sensitive/raw email leakage to untrusted channels.

## 6) Ops checks

- Monitor:
  - watch renew failures
  - auth failures
  - processing lag
- Define recovery runbook (restart worker, re-establish watch if needed).

## 7) Scheduling policy (authoritative)

For recurring operational jobs in this workflow:
- Use OpenClaw-native scheduling only: `openclaw cron ...`
- Do **not** manage this workflow via generic host cron edits.

## 8) Final acceptance

Mark complete only when:
- live ingest test passed,
- persistence configured,
- monitoring/recovery documented,
- and remaining risks/TODOs are listed.
