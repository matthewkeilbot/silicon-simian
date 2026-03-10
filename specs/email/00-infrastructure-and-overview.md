# Email Infrastructure & Processing Overview (Inbound-Only, Agent Mailbox)

Status: Draft v4  
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
- Attempt tracking with mailbox tags only.
- Fallback routing to Unhandled.
- Spam/promotional unsubscribe + Junk routing.
- Periodic digest of Unhandled + Failed Processing items.

### Out of scope (v1)
- Outbound email sending.
- Rich reply drafting workflows.
- Detailed per-category handling policy logic (future spec).

---

## 3) System Principles

1. **INBOX is the durable queue** for unhandled items.
2. **Move is commit**: emails are moved only after successful handling.
3. **Failure keeps item in INBOX** for automatic retry on next pass.
4. **Mailbox tags are retry state** (avoid local durable retry DB).
5. **Idempotent actions** so retries are safe.

---

## 4) Canonical Mailbox State Model

- **INBOX**: unhandled items, pending processing.
- **Policy storage folders**: terminal handled states (naming/structure per policy).
- **Unhandled folder**: no policy matched.
- **Failed Processing folder**: exhausted retry budget.
- **Junk folder**: spam/promotional outcomes.

Interpretation:
- If message remains in INBOX, handling is not committed.
- If moved out of INBOX, handling committed.

---

## 5) Processing Contract (Critical Invariant)

For each message in INBOX:

1. Determine attempt state from attempt tags.
2. Apply attempt-tag update rules (below).
3. If 4th encounter condition is met, do not process; move to Failed Processing.
4. Otherwise run required handling steps.
5. **Only if all required handling steps succeed**: remove attempt tags and move to terminal destination.
6. If required handling fails: keep in INBOX; tags persist for next retry.

### Commit semantics
- The folder move is the commit point.
- No move = no commit.

---

## 6) Attempt Tracking Tags (Mailbox-Native)

Attempt tags:
- `proc_attempt_1`
- `proc_attempt_2`
- `proc_attempt_3`

Rule:
- On each processing encounter, add the **lowest unused** attempt tag.
- Do **not** remove previous attempt tags during retries.

Examples:
- No attempt tags → add `proc_attempt_1`, then process.
- Has `proc_attempt_1` only → add `proc_attempt_2`, then process.
- Has `proc_attempt_1` + `proc_attempt_2` → add `proc_attempt_3`, then process.
- Has all three attempt tags already (4th encounter) → do not process.

### 4th encounter behavior
If `proc_attempt_1`,`proc_attempt_2`,`proc_attempt_3` already exist before processing:
- Skip handling execution.
- Remove all attempt tags.
- Move message to **Failed Processing**.
- Include in digest.

### Success behavior
On successful handling (attempt 1, 2, or 3):
- Remove all `proc_attempt_*` tags.
- Then move to terminal destination.

---

## 7) Handling Outcomes

### A) Policy match
- Required handling runs.
- On success: clear attempt tags, move to policy storage folder.
- On failure: keep in INBOX with accumulated attempt tags.

### B) No policy match
- Required handling is minimal classification + fallback routing.
- On success: clear attempt tags, move to **Unhandled**.
- On failure: keep in INBOX with accumulated attempt tags.

### C) Spam/promotional
- Attempt unsubscribe (when safely supported, e.g., List-Unsubscribe).
- Apply/refresh rule for future routing if supported.
- On success: clear attempt tags, move to **Junk**.
- On failure: keep in INBOX with accumulated attempt tags.

---

## 8) Error Recording for Each Attempt

Need: preserve per-attempt failure reason without local state dependency.

### Mailbox-visible error labels
For each failed attempt, apply one attempt-scoped error label:
- `proc_err_a1_<code>`
- `proc_err_a2_<code>`
- `proc_err_a3_<code>`

Where `<code>` is from a bounded taxonomy, e.g.:
- `rule_eval`
- `unsubscribe`
- `move`
- `auth`
- `timeout`
- `rate_limit`
- `unknown`

Rules:
- Add the attempt error label only when that attempt fails.
- Do not remove older attempt error labels during retries.
- On successful handling, remove all `proc_err_a*_` labels before terminal move.
- On move to Failed Processing, keep error labels for audit/review.

### Detailed diagnostics
Detailed stack/error text lives in runtime logs keyed by messageId + attempt number. Mailbox labels carry compact reason codes for workflow visibility.

---

## 9) Daily Rolling Digest Workflow (Unhandled + Failed + Errors)

Digest cadence is **once per day**.

### Digest file location + naming
- Directory: `/state/email`
- File name: `YYYY-MM-DD-email-digest.md`

Example:
- `/state/email/2026-03-10-email-digest.md`

### Build model
The daily digest is built incrementally as the day progresses (rolling accumulation):
- During the digest period, when an item becomes Unhandled, append/update it in **Unhandled** section.
- During the digest period, when an item moves to Failed Processing, append/update it in **Failed** section.
- During the digest period, when an attempt error occurs, append/update it in **Errors** section.

By end-of-day digest time, the file is already complete and ready to present.

### Required daily format
```md
# Email Digest for YYYY-MM-DD

### Unhandled

### Failed

### Errors
```

### Entry fields (minimum)
- sender
- subject
- received time
- attempt tags present / attempts exhausted
- suggested action

### Errors section additional fields
- messageId/threadId
- attempt number
- error code label (e.g., `proc_err_a2_timeout`)
- short error summary
- status (`will_retry` if still in INBOX, `moved_failed_processing` if terminal)

Notes:
- Errors section is the canonical digest surface for operational failure details.
- Error labels remain on messages for machine-readable workflow state; digest provides human-readable review.

---

## 10) Infrastructure Architecture

Flow:
1. Gmail watch emits mailbox changes to Pub/Sub.
2. Pub/Sub pushes to secured webhook endpoint.
3. Handler (`openclaw webhooks gmail run`) forwards to OpenClaw `/hooks/gmail`.
4. OpenClaw resolves history delta and fetches needed message data.
5. Agent processes INBOX queue under attempt-tag + handle-then-move contract.

Note:
Gmail Pub/Sub is change-notification driven (history-based), not guaranteed full payload delivery by itself.

---

## 11) Nginx Edge Requirements

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

## 12) Runtime & Ops

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

## 13) Reliability & Retry

- Retry is natural: failed items remain in INBOX.
- Retry state is encoded in attempt tags on the message.
- Re-runs must be idempotent.
- Replay from last known history anchor when needed.
- If history window expires, perform bounded resync and continue.

No separate local “handled DB” should be required for correctness.

---

## 14) Security Baseline

- Least-privilege OAuth scopes for inbound path.
- No outbound send scope in v1.
- Secrets only in OpenClaw-managed config.
- Do not leak sensitive raw email data into untrusted channels.

---

## 15) Next Specs (Deferred)

Future documents under `specs/email/` should cover:
- `01-inbound-policy-and-routing.md`
- `02-unhandled-and-failed-digest-review.md`
- `03-spam-promotions-unsubscribe-policy.md`

This file remains the infrastructure + processing contract overview.