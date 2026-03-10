# Email Infrastructure & Processing Overview (Inbound-Only, Agent Mailbox)

Status: Draft v3  
Owner: MEK agent  
Date: 2026-03-10

## 1) Purpose

Define the infrastructure and core processing contract for **MEK’s own mailbox** so inbound email is handled reliably without local state drift.

This document is intentionally limited to infrastructure + operational flow.

---

## 2) Scope Boundaries

### In scope (v1)
- Gmail watch + Pub/Sub delivery into OpenClaw.
- Inbound-only processing (no outbound send).
- Inbox-as-queue model (INBOX is source of truth for unhandled work).
- Handle-then-move commit semantics.
- Fallback routing to Unhandled.
- Spam/promotional unsubscribe + Junk routing.
- Periodic digest of Unhandled items.

### Out of scope (v1)
- Outbound email sending.
- Rich reply drafting workflows.
- Detailed per-category handling policy logic (future spec).

---

## 3) System Principles

1. **INBOX is the durable queue** for unhandled items.
2. **Move is commit**: emails are moved only after successful handling.
3. **Failure keeps item in INBOX** for automatic retry on next pass.
4. **Mailbox state is source of truth** (avoid local durable state).
5. **Idempotent actions** so retries are safe.

---

## 4) Canonical Mailbox State Model

- **INBOX**: unhandled items, pending processing.
- **Policy storage folders**: terminal handled states (naming/structure per policy).
- **Unhandled folder**: no policy matched.
- **Junk folder**: spam/promotional outcomes.

Interpretation:
- If a message is still in INBOX, it is not fully handled.
- If a message is outside INBOX in a destination folder, handling succeeded.

---

## 5) Processing Contract (Critical Invariant)

For each message in INBOX:

1. Evaluate policy and determine planned destination/action.
2. Execute required handling steps.
3. **Only if all required handling steps succeed**: move message out of INBOX to destination folder.
4. If any required step fails: do not move; message remains in INBOX for retry.

### Commit semantics
- The folder move is the commit point.
- No move = no commit.
- This gives effective retry safety without local sync state.

---

## 6) Handling Outcomes

## A) Policy match
- Required handling runs.
- On success: move to policy-defined storage folder.
- On failure: stay in INBOX.

## B) No policy match
- Required handling is minimal classification + fallback routing.
- On success: move to **Unhandled**.
- On failure: stay in INBOX.

## C) Spam/promotional
- Attempt unsubscribe (when safely supported, e.g., List-Unsubscribe).
- Apply/refresh rule for future routing if supported.
- On success: move to **Junk**.
- On failure of required steps: stay in INBOX for retry.

---

## 7) Digest Workflow (Unhandled Review)

A few times per day, produce a digest of messages routed to **Unhandled** since last digest window.

Digest item fields:
- sender
- subject
- received time
- reason unmatched
- proposed new policy rule (one-line suggestion)

Purpose:
- tighten inbound policy iteratively
- reduce future Unhandled volume

---

## 8) Infrastructure Architecture

Flow:
1. Gmail watch emits mailbox changes to Pub/Sub.
2. Pub/Sub pushes to secured webhook endpoint.
3. Handler (`openclaw webhooks gmail run`) forwards to OpenClaw `/hooks/gmail`.
4. OpenClaw resolves history delta and fetches needed message data.
5. Agent processes INBOX queue under handle-then-move invariant.

Note:
Gmail Pub/Sub is change-notification driven (history-based), not guaranteed full payload delivery by itself.

---

## 9) Nginx Edge Requirements

If exposed publicly, nginx should provide:
- TLS termination.
- Dedicated webhook path (e.g., `/gmail-pubsub`).
- Method restriction (POST).
- Request size/timeout limits.
- Access logging.

Auth/integrity baseline:
- Pub/Sub OIDC JWT verification and/or
- shared push token validation.

Recommendation: OIDC + token defense-in-depth.

---

## 10) Runtime & Ops

Primary setup/run commands:
- `openclaw webhooks gmail setup --account <agent-email>`
- `openclaw webhooks gmail run`

Relevant flags:
- `--include-body`
- `--max-bytes`
- `--renew-minutes`
- bind/path/hook options

Operational requirements:
- run as long-lived service (systemd preferred)
- auto-restart on failure
- monitor renew failures, auth failures, processing lag

---

## 11) Reliability & Retry

- Retry is natural: failed items remain in INBOX.
- Re-runs must be idempotent.
- Replay from last known history anchor when needed.
- If history window expires, perform bounded resync and continue.

No separate local “handled DB” should be required for correctness.

---

## 12) Security Baseline

- Least-privilege OAuth scopes for inbound path.
- No outbound send scope in v1.
- Secrets only in OpenClaw-managed config.
- Do not leak sensitive raw email data into untrusted channels.

---

## 13) Next Specs (Deferred)

Future documents under `specs/email/` should cover:
- `01-inbound-policy-and-routing.md`
- `02-unhandled-digest-and-human-review.md`
- `03-spam-promotions-unsubscribe-policy.md`

This file remains the infrastructure + processing contract overview.