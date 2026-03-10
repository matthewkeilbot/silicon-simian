# Email Handling Spec (OpenClaw + Gmail)

Status: Draft v1  
Owner: MEK agent  
Date: 2026-03-10

## 1) Purpose

Define a reliable, secure, low-noise email workflow for Matthew using OpenClaw, with Gmail Pub/Sub webhooks for near-real-time ingest and optional Google Workspace CLI/API actions for fetch/draft/send.

---

## 2) Core Principles

1. **Notify only when useful**: no spammy “new email” pings.
2. **Default to safe actions**: draft-first, explicit confirmation before external sends.
3. **Deterministic pipeline**: event → fetch → classify → summarize → route.
4. **Least privilege**: minimal OAuth scopes and endpoint exposure.
5. **Fail loudly, recover cleanly**: health checks + replay from historyId.

---

## 3) Scope

### In scope
- Incoming Gmail detection via Pub/Sub webhook pipeline.
- Fetching message metadata/body snippet (or full body when needed via Gmail API/CLI).
- Priority classification and digesting.
- Draft generation and suggested replies.
- Controlled sending flow with guardrails.

### Out of scope (v1)
- Multi-provider email (Outlook/Fastmail/etc).
- Autonomous sending without confirmation.
- Bulk mailbox migration/cleanup automation.

---

## 4) High-Level Architecture

1. **Gmail Watch** posts mailbox changes to Pub/Sub.
2. **Push handler** (`openclaw webhooks gmail run` / `gog gmail watch serve`) receives push.
3. Handler forwards event to OpenClaw webhook endpoint (`/hooks/gmail`).
4. OpenClaw resolves history delta and fetches relevant message data.
5. Agent applies rules:
   - ignore noise/newsletters if configured
   - detect urgency/people/projects
   - trigger one of: silent log, digest queue, immediate alert
6. For reply workflows:
   - generate draft
   - request Matt confirmation for send
   - send only after explicit approval

---

## 5) Nginx Role

Use nginx as the public edge for webhook ingress when needed.

### Requirements
- TLS termination (Let’s Encrypt or existing cert chain).
- Reverse proxy only to local handler (`127.0.0.1:<port>`).
- Restrict methods and path to dedicated endpoint (e.g. `/gmail-pubsub`).
- Request size limits and timeouts.
- Access logs enabled for audit; sensitive headers redacted where possible.

### Authentication
At least one of:
- Shared push token (`x-gog-token` / query token) validated by handler.
- Pub/Sub OIDC JWT validation (`--verify-oidc` with allowed service account email).

Recommendation: **OIDC in production** + token as defense-in-depth if supported.

---

## 6) Event/Data Model

## Inbound event (minimum)
- account email
- historyId
- received timestamp

## Enriched email record
- messageId / threadId
- from / to / cc
- subject
- date
- labels
- snippet/body_excerpt (size-limited)
- classification tags (e.g., `urgent`, `finance`, `lodestar`, `newsletter`)
- action state (`ignored`, `digest`, `alerted`, `drafted`, `approved`, `sent`)

---

## 7) Processing Rules (v1)

### Priority routing
1. **Immediate alert** if:
   - sender in VIP allowlist, or
   - subject/body contains urgent keywords + human sender, or
   - calendar/travel/finance critical class.

2. **Digest queue** if:
   - normal human email, non-urgent.

3. **Silent/no-alert** if:
   - newsletters/promotions/automated notifications (unless explicitly watched).

### Deduplication
- Key by `messageId`.
- Track last processed `historyId` per account.
- Ignore repeats unless label/state materially changes.

### Body handling
- Default: snippet/body excerpt only.
- Full body fetch only when user asks or classifier needs disambiguation.

---

## 8) Outbound Email Policy

### Modes
- **Draft-only (default)**: agent prepares drafts, no sends.
- **Confirmed-send**: explicit Matt confirmation required per message.

### Hard guardrails
- No autonomous external send in v1.
- Optional recipient allowlist for first rollout.
- Show final To/CC/BCC + subject preview before send.
- Block if unresolved ambiguity (“which John?” etc.).

---

## 9) Security & Privacy

- Keep OAuth scopes minimal (read + compose initially; send scope only when enabling confirmed-send).
- Store tokens in existing OpenClaw secure config paths only.
- Never post raw email content into untrusted channels.
- In shared group chats, provide summaries only when explicitly asked.
- Log operational metadata; avoid logging full sensitive bodies by default.

---

## 10) Reliability & Operations

### Service lifecycle
- Run webhook handler as long-lived service (tmux/systemd).
- Auto-renew Gmail watch (handled by `openclaw webhooks gmail run`).

### Health checks
- Endpoint liveness check via nginx upstream status/logs.
- Periodic watch status verification.
- Alert on:
  - watch expiry/renew failure
  - repeated 401/403 auth failures
  - history replay failures

### Recovery
- On downtime gap: replay from last known `historyId` using Gmail history API/CLI.
- If history window exceeded, perform bounded resync (recent N days / labels).

---

## 11) User Experience

### Alert style
- For urgent items: short actionable summary:
  - sender, subject, why it matters, suggested next action.
- For digest: grouped by project/priority, 1-3 bullets each.

### Command surface (human-facing)
Examples:
- “show urgent emails since this morning”
- “summarize unread from Lodestar”
- “draft reply to this one”
- “send draft #3 now”

---

## 12) Rollout Plan

### Phase 1 — Ingest + Summarize (no sending)
- Configure Gmail webhook flow.
- Enable classification + digest.
- Validate low false-positive alerting.

### Phase 2 — Draft workflows
- Add draft generation from inbound emails.
- Human review loop.

### Phase 3 — Confirmed send
- Enable send scope.
- Keep per-message explicit confirmation.

---

## 13) Open Questions

1. Confirm preferred source of truth for outbound actions:
   - OpenClaw webhook + Gmail API path, or
   - New Google Workspace CLI for both read/write operations.
2. Desired urgency window and keyword list.
3. Recipient allowlist needed for initial send rollout?
4. Retention policy for stored email excerpts/classification metadata.

---

## 14) Concrete Recommendation

Start with **OpenClaw Gmail webhook ingest + draft-only workflows** immediately.  
Use the new Workspace CLI/API as the action layer for richer fetch/draft/send once auth/scopes are confirmed.  
Do **not** enable autonomous send in v1.
