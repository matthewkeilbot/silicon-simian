# 03 — Distill with Progressive Summarization (with SurrealDB)

## Objective
Make old notes increasingly scannable so retrieval returns useful context fast, while also producing structured summaries and durable assertions where appropriate.

---

## Distillation levels
- **L0** Raw capture (daily bullets / raw episodes)
- **L1** Highlight key lines (manual/agent emphasis)
- **L2** One-paragraph summary per section or topic
- **L3** Executive summary + actionable takeaways
- **L4** Structured promotion into assertions / entity updates / summary records

---

## Cadence
- **Daily:** L0 capture only
- **Every 2–3 days:** distill recent notes to L1/L2
- **Weekly:** promote best L2/L3 points into PARA, bank, summaries, or `MEMORY.md`
- **Periodic structured pass:** extract/update SurrealDB summaries and assertions

---

## Retrieval alignment
- prefer serving L2/L3 snippets when available
- use L4 structured summaries/assertions when queries are temporal, entity-centric, or contradiction-sensitive
- fall back to L0 raw lines if no better summary exists

---

## Distillation outputs

### Human-facing outputs
- improved markdown summaries
- cleaner bank files
- lighter `MEMORY.md`
- easier entity pages

### Structured outputs
- `summary` records for sessions/entities/topics/time windows
- candidate `assertion` records from durable, repeated, or clearly factual distilled content
- entity summary updates
- supersession/contradiction checks when distilled content conflicts with existing assertions

---

## Promotion rules
Distillation should not blindly create structured memory.

Promote when one or more apply:
- durable fact
- recurring pattern
- stable preference
- important decision
- reusable lesson
- compressed summary likely to help future retrieval

Avoid promotion when content is:
- pure chatter
- one-off low-value detail
- uncertain without support
- already represented by a stronger existing assertion/summary

---

## Success metric
- time-to-useful-context under 30 seconds for common recall queries
- reduced duplicate injections from raw notes
- structured summaries/assertions improve recall quality on temporal and entity-centric questions
