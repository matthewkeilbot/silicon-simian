# 05 — Governance, Privacy, and Maintenance

## Objective
Keep memory trustworthy, private, and maintainable over long horizons.

## Privacy boundaries
- Never load private long-term memory in group contexts.
- Track source scope (DM vs group) for each durable item.
- Add explicit “do-not-store” handling for sensitive user requests.

## Data hygiene
- Dedupe repeated facts.
- Mark superseded facts with `status: replaced` semantics in markdown.
- Run monthly cleanup pass on stale todos and outdated preferences.

## Quality controls
- Confidence tag per extracted memory (`high|medium|low`).
- Contradiction checks before writing durable facts.
- Lightweight audit trail: when and why an item moved to `MEMORY.md`.

## Operational SLOs
- recall precision > recall volume
- memory updates should be near-zero friction
- no accidental cross-context leakage
