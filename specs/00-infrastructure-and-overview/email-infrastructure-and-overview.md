# Email Infrastructure & Overview (Inbound-Only, Agent Mailbox)

Status: Draft v2  
Owner: MEK agent  
Date: 2026-03-10

## 1) Purpose

Define the infrastructure required for **MEK’s own mailbox** so the agent can reliably receive, ingest, and triage inbound email.

This spec is intentionally limited to **infrastructure + operational overview**.

- Scope is **agent email**, not Matthew’s personal mailbox workflows.
- Scope is **inbound-only** for initial rollout.
- Outbound send/draft behavior is deferred to later specs.

---

## 2) Scope Boundaries

### In scope (v1)
- Gmail watch + Pub/Sub event delivery.
- Webhook ingress to OpenClaw.
- Event enrichment path for message metadata/body snippet.
- Basic storage/state tracking for reliable processing.
- Service lifecycle, monitoring, and recovery.
- Rough initial plan for organization and cleanup (infra-level only).

### Explicitly out of scope (v1)
- Sending email.
- Reply drafting and approval UX.
- Detailed policy logic by email category/person.
- Advanced automation behavior (these go into future email-specific specs).

---

## 3) Target Architecture

Flow:
1. Gmail mailbox watch emits changes to Google Pub/Sub.
2. Pub/Sub pushes events to a secured webhook endpoint.
3. Webhook handler (`openclaw webhooks gmail run`) forwards to OpenClaw `/hooks/gmail`.
4. OpenClaw resolves history deltas and fetches message-level data as needed.
5. Agent receives normalized inbound email events for triage.

### Key detail
Gmail Pub/Sub is a **change notification** channel (history-based), not a guaranteed full-message payload pipe. Message content is retrieved through history/message fetch; snippet inclusion is controlled by runtime flags.

---

## 4) Endpoint Exposure (Nginx)

Nginx acts as public edge when internet exposure is required.

### Requirements
- TLS termination (valid certs).
- Dedicated path (e.g. `/gmail-pubsub`) proxied to local handler.
- Method restriction (POST only).
- Sensible body size and timeout limits.
- Access logging for operations/audit.

### Auth & integrity
Use at least one:
- Shared push token validation.
- Pub/Sub OIDC JWT verification (`--verify-oidc`, constrained service account).

Recommended baseline: **OIDC + token defense-in-depth**.

---

## 5) Runtime Configuration (Inbound)

Primary runtime path:
- `openclaw webhooks gmail setup --account <agent-email>`
- `openclaw webhooks gmail run`

Relevant runtime knobs:
- `--include-body` (include bounded body snippet in forwarded payload)
- `--max-bytes` (snippet cap)
- `--renew-minutes` (watch renewal cadence)
- `--hook-url`, `--hook-token` (internal OpenClaw webhook wiring)
- endpoint bind/path options for local hosting

---

## 6) Data & State (Infra-Level)

Minimum operational state:
- last processed `historyId` per mailbox
- dedupe keys (messageId/threadId where applicable)
- processing timestamps
- failure/retry counters

Storage guidance:
- Keep operational metadata compact and append-safe.
- Avoid storing full raw bodies by default in infra logs.
- Retain enough state to replay after downtime.

---

## 7) Reliability & Recovery

### Uptime model
- Run webhook handler as long-lived service (systemd preferred; tmux acceptable short-term).
- Ensure restart-on-failure behavior.

### Monitoring
Track at minimum:
- webhook ingress success/error rate
- auth failures (401/403)
- watch renew success/failure
- processing lag from push receipt to event availability

### Recovery
- Reprocess from last good `historyId` using Gmail history fetch.
- If history window expired, perform bounded resync (recent time window) and re-anchor state.

---

## 8) Initial Organization & Cleanup Plan (Rough)

Infrastructure-phase baseline only (not policy-heavy):

1. **Initial labeling buckets**
   - `inbox/untriaged`
   - `inbox/important-candidate`
   - `inbox/automated-candidate`
   - `inbox/processed`

2. **Cleanup cadence**
   - daily: clear stuck/unprocessed events, verify backlog age
   - weekly: prune stale operational logs beyond retention target
   - monthly: review label cardinality and simplify if drifted

3. **Backlog hygiene guardrails**
   - enforce max unprocessed age threshold
   - alert if queue/backlog exceeds threshold
   - favor idempotent reprocessing over manual patching

This is intentionally lightweight and infra-oriented; behavior-specific cleanup rules will live in future email policy specs.

---

## 9) Security Baseline

- Least-privilege OAuth scopes for inbound read path only.
- No outbound send scope in v1.
- Secrets stored only in OpenClaw-managed config locations.
- No raw sensitive content leakage into untrusted channels/log streams.

---

## 10) Rollout Phases

### Phase 0 — Infra bring-up
- Configure Pub/Sub + webhook route.
- Validate end-to-end ingress and normalization.

### Phase 1 — Stable inbound ops
- Enable watch auto-renew + monitoring + replay drills.
- Confirm low-noise operational behavior.

### Phase 2 — Expand via separate specs
- Add email-type handling rules.
- Add triage policy and summarization behavior.
- Consider outbound workflows later (separate spec, not this document).

---

## 11) Non-Goals Reminder

This file should remain locked to infrastructure and overview concerns.  
Process/policy logic for handling specific email classes belongs in separate, dedicated specs.
