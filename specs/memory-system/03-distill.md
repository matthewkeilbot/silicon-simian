# 03 — Distill with Progressive Summarization

## Objective
Make old notes increasingly scannable so retrieval returns useful snippets fast.

## Distillation levels
- **L0** Raw capture (daily bullets)
- **L1** Highlight key lines (manual/agent emphasis)
- **L2** One-paragraph summary per section
- **L3** Executive summary + actionable takeaways

## Cadence
- Daily: L0 capture only.
- Every 2-3 days: distill recent notes to L1/L2.
- Weekly: promote best L2/L3 points into PARA or `MEMORY.md`.

## Retrieval alignment
- Prefer serving L2/L3 snippets when available.
- Fall back to L0 raw lines if no summary exists.

## Success metric
- “Time-to-useful-context” under 30 seconds for common recall queries.
