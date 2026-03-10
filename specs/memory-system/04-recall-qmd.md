# 04 — Recall Architecture (Built-in + QMD)

## Objective
Deliver accurate, fast recall while preserving markdown as source of truth.

## Current reality
OpenClaw already supports:
- builtin memory search manager
- optional `memory.backend = "qmd"` (experimental)

## Recommended strategy
1. Keep builtin backend as safe default.
2. Enable QMD in environments where local model/runtime prerequisites are met.
3. Keep automatic fallback to builtin if QMD fails.

## Why QMD matters
- Hybrid retrieval (keyword + semantic + rerank) improves recall quality.
- Useful for larger memory corpora and nuanced queries.

## Proposed tuning priorities
- Set sensible result limits to avoid context flooding.
- Restrict memory scope in group chats unless explicitly intended.
- Enable citations to support traceability (`Source: path#line`).

## Hybrid Local Index (Exact + Semantic)

Support both exact and conceptual retrieval for robust recall.

### Retrieval stack
- **Lexical/FTS** for exact strings (IDs, names, terms, references)
- **Semantic retrieval** for conceptual lookups
- **Unified ranking** with metadata gating:
  - domain match
  - project match
  - recency
  - importance

### Why both
- Pure vector misses exact tokens (task IDs, names, error codes).
- Pure keyword misses conceptual similarity ("deployment issue" ↔ "CI failure").
- Hybrid with metadata gating ensures domain-appropriate results.

---

## Validation checklist
- cold start performance acceptable
- first-query model download behavior understood
- graceful degradation verified (QMD down → builtin still works)
- hybrid retrieval returns exact matches for ID/name queries
- semantic retrieval surfaces conceptually related results
