# 01 — Capture Contract (with SurrealDB)

## Objective
Capture high-signal information quickly without creating maintenance burden, while producing inputs that can later be reflected into structured memory.

## Rules
Capture only items that pass one of:
- decision made
- preference learned
- recurring pattern observed
- commitment/todo accepted
- reusable insight discovered
- state checkpoint needed for compaction resilience

Everything else remains ephemeral chat context unless later promoted.

---

## Inputs
- user messages
- agent actions/outcomes
- heartbeat checks
- external research summaries
- sub-agent outcomes
- tool results

---

## Output targets

### Canonical markdown targets
- `memory/YYYY-MM-DD.md` (default write target)
- `MEMORY.md` (only for durable items and private main-session scope)
- `bank/*.md` and entity pages (for organized durable knowledge)

### Derived structured targets
Captured material may later be extracted into:
- `episode`
- `entity`
- `assertion`
- `summary`

Markdown capture happens first; structured extraction follows.

---

## Proposed markdown schema
Each captured item in daily notes should use tagged bullets:
- `- [decision] ...`
- `- [preference] ...`
- `- [todo] ...`
- `- [insight] ...`
- `- [context] ...`
- `- [checkpoint] ...`

This keeps plain markdown while enabling easy parsing and promotion.

---

## Domain Taxonomy Tags
Each captured item should also carry metadata where applicable:
- `domain:` (`work`, `personal`, `operations`, `learning`, `admin`, `social`, `health`)
- `project:` (nullable)
- `sensitivity:` (`public`, `private`, `restricted`)
- `entity_type:` where relevant
- `time_horizon:` (`now`, `this_week`, `later`, `archived`) where relevant

Example:
`- [decision] domain:operations project:memory-system sensitivity:private — Adopted SurrealDB as first-class structured memory candidate`

---

## Structured extraction mapping

### `[decision]`
Likely outputs:
- `episode`
- `assertion`
- maybe `bank/decisions.md`

### `[preference]`
Likely outputs:
- `episode`
- `assertion`
- maybe `MEMORY.md`

### `[todo]`
Likely outputs:
- `episode`
- operational task state
- not a durable assertion by default

### `[insight]`
Likely outputs:
- `episode`
- candidate `assertion` or lesson entry

### `[context]`
Likely outputs:
- `episode`
- maybe entity mentions
- generally not promoted unless reconfirmed or important

### `[checkpoint]`
Likely outputs:
- `episode`
- `summary`
- task/session state restoration hints

---

## Structured extraction requirements
When material is promoted into structured memory, the extractor should try to produce:
- source episode reference
- entity mentions
- normalized predicate/object form where possible
- confidence
- salience
- candidate fingerprint for dedupe
- observed time / valid time where applicable

This prevents the structured layer from becoming untraceable fan fiction.

---

## Sub-agent outcome integration
When sub-agents complete work:
- capture key outcomes in the daily note
- route durable results to the appropriate typed bank file or entity page
- reflect durable facts into structured assertions where appropriate
- update BACKLOG.md status and STATE.md focus in the same work cycle

---

## Automation hooks
- On pre-compaction memory flush:
  - create a durability pass over recent high-signal items
  - emit checkpoint bullet if needed
- Add dedupe check by normalized sentence hash before append
- Add extractor job to convert eligible markdown bullets into structured records
- Add reconfirmation logic so repeated observations strengthen an existing assertion instead of cloning junk duplicates forever

---

## Capture quality rule
Do not store low-signal chatter just because storage is cheap.

Storage may be cheap.
Attention is not.
