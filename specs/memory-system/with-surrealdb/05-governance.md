# 05 — Governance, Privacy, and Maintenance (with SurrealDB)

## Objective
Keep memory trustworthy, private, explainable, and maintainable over long horizons across both Markdown and structured memory.

---

## Privacy boundaries
- Never load private long-term memory in group contexts
- Track source scope (DM vs group) for each durable item
- Add explicit do-not-store handling for sensitive requests
- Apply the same privacy boundaries to structured memory as to Markdown memory

If it would be unsafe in `MEMORY.md`, it is also unsafe in SurrealDB. Same snake, different basket.

---

## Data hygiene
- dedupe repeated facts
- mark superseded facts clearly
- keep old truth historically queryable instead of deleting it blindly
- run periodic cleanup on stale todos and outdated preferences
- merge duplicate entities carefully

---

## Structured-memory governance rules

### Provenance rule
Every durable assertion should be traceable to one or more source episodes/notes.

### Supersession rule
When truth changes:
- do not overwrite in place without history
- mark older assertion as superseded
- record replacement linkage
- prefer active/newer fact during normal recall

### Contradiction rule
If evidence conflicts and resolution is unclear:
- preserve both assertions
- mark contradiction state/relation
- avoid false confidence
- surface ambiguity when relevant

### Confirmation rule
Repeated evidence should usually strengthen or reconfirm an existing assertion rather than generating a new duplicate.

### Scope rule
Structured assertions inherit privacy/scope constraints from their source material unless explicitly reclassified by policy.

---

## Quality controls
- confidence tag per extracted memory (`high|medium|low` or numeric equivalent)
- contradiction checks before writing durable facts
- lightweight audit trail for promotions and supersession
- salience scoring for retrieval prioritization
- review path for uncertain/high-impact facts

---

## Maintenance cadences

### Frequent
- dedupe recent captures
- verify checkpoint summaries exist for long-running tasks
- confirm active project/task state stays coherent

### Weekly
- distill recent notes
- promote durable assertions and summaries
- clean up obvious low-signal noise

### Monthly
- stale todo review
- outdated preference review
- duplicate entity review
- low-confidence assertion review
- contradiction review
- archived/superseded memory cleanup pass

---

## Operational SLOs
- recall precision > recall volume
- memory updates should remain low-friction
- no accidental cross-context leakage
- structured memory remains explainable
- active facts should not be silently contaminated by stale superseded facts

---

## Auditability requirements
For any important durable memory item, it should be possible to answer:
- what is the current assertion?
- what evidence supports it?
- when was it observed?
- what did it replace?
- what contradicts it, if anything?
- why was it promoted?

If we can’t answer those, the system is accumulating belief sludge instead of memory.
