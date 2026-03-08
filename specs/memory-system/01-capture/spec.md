# 01 - Capture Contract

## Objective
Capture high-signal information quickly without creating maintenance burden.

## Rules
- Capture only items that pass one of:
  - decision made
  - preference learned
  - recurring pattern observed
  - commitment/todo accepted
  - reusable insight discovered
- Everything else remains ephemeral chat context.

## Inputs
- User messages
- Agent actions/outcomes
- Heartbeat checks
- External research summaries

## Output targets
- `memory/YYYY-MM-DD.md` (default write target)
- `MEMORY.md` (only for durable items and private main-session scope)

## Proposed schema (lightweight markdown)
Each captured item in daily notes should use tagged bullets:
- `- [decision] ...`
- `- [preference] ...`
- `- [todo] ...`
- `- [insight] ...`
- `- [context] ...`

This keeps plain markdown while enabling easy parsing/summarization.

## Domain Taxonomy Tags
Each captured item should also carry domain metadata where applicable:
- `domain:` (work, personal, operations, learning, admin, social, health)
- `project:` (nullable)
- `sensitivity:` (public, private, restricted)

Example: `- [decision] domain:operations project:memory-system — Adopted orchestrator-first execution model`

## Sub-Agent Outcome Integration
When sub-agents complete work:
- Capture key outcomes as tagged bullets in the daily note.
- Route durable results to the appropriate typed bank file or entity page.
- Update BACKLOG.md status and STATE.md focus in the same work cycle.

## Automation hooks
- On memory flush events (pre-compaction), run a quick "durability pass":
  - promote items matching decision/preference/long-term commitments.
- Add dedupe check by normalized sentence hash before append.
