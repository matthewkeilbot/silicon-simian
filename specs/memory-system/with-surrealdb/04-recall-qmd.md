# 04 — Recall Architecture (QMD + SurrealDB)

## Objective
Deliver accurate, fast recall while preserving markdown as source of truth and using SurrealDB as the structured memory layer.

This spec treats recall as a **dual-plane system**.

---

## Current reality
OpenClaw already supports:
- builtin memory search manager
- optional `memory.backend = "qmd"` (experimental)

Those remain useful and should continue to power **text recall**.

---

## Recommended strategy
1. Keep builtin backend as safe default
2. Enable QMD where local prerequisites are met
3. Add SurrealDB as the structured-memory backend for assertions/entities/summaries/provenance
4. Merge text and structured results into one ranked recall output
5. Keep graceful degradation:
   - QMD down → builtin text recall still works
   - SurrealDB unavailable → text recall still works

---

## Two recall planes

## Plane A — Text recall
Purpose:
- exact and conceptual retrieval over markdown notes, bank files, entity pages, and summaries

Stack:
- builtin memory backend or QMD
- lexical / FTS retrieval
- semantic retrieval
- reranking / citations

Best for:
- exact strings
- recent notes
- broad research recall
- human-written context

## Plane B — Structured recall
Purpose:
- temporal and entity-centric retrieval over structured memory

Stack:
- SurrealDB queries over:
  - `episode`
  - `entity`
  - `assertion`
  - `summary`
  - relation records (supports, supersedes, contradicts, applies_to, etc.)

Best for:
- “what changed?”
- “what do we know about X?”
- “what evidence supports this?”
- “which fact is current vs superseded?”
- cross-project lessons and relationship-aware recall

---

## Unified retrieval stack

### Candidate generation
Generate candidates from both planes:
- lexical/FTS text hits
- semantic text hits
- assertion hits
- summary hits
- graph neighborhood / relation hits
- source episodes supporting top assertions

### Metadata gating
Apply gating and ranking factors such as:
- domain match
- project match
- recency
- importance
- confidence
- sensitivity/scope
- assertion state (`active`, `superseded`, `contradicted`, `uncertain`)

### Reranking
Use a final rank that can combine:
- text relevance
- semantic relevance
- graph distance / relationship relevance
- temporal fitness
- salience
- confidence
- diversity (MMR-like suppression of duplicates)

---

## Query modes

### 1. Exact lookup
Use when the query includes:
- IDs
- names
- exact error strings
- specific file references

Prefer:
- lexical/FTS
- exact entity match

### 2. Conceptual recall
Use for broad semantic queries.

Prefer:
- QMD / semantic text retrieval
- summaries
- supporting structured assertions if available

### 3. Temporal recall
Use for:
- “what changed?”
- “what was true before?”
- “what’s current now?”

Prefer:
- assertions with validity windows
- supersession chains
- supporting episodes/summaries

### 4. Entity-centric recall
Use for:
- “what do we know about X?”
- “what’s the status of project Y?”

Prefer:
- entity summaries
- active assertions
- linked source episodes

### 5. Contradiction-aware recall
Use when multiple conflicting facts exist.

Prefer:
- show the current/active assertion
- include contradictory/superseded assertion only when useful
- provide timestamps/confidence/source evidence

---

## Example answer assembly patterns

### factual query
Return:
- top assertion(s)
- concise supporting text snippets
- source reference(s)

### temporal query
Return:
- ordered assertion timeline
- current active state
- source episodes or summaries

### broad topic query
Return:
- summary first
- top supporting snippets/assertions second

### contradiction query
Return:
- current best-supported assertion
- note of contradiction/supersession
- supporting evidence

---

## Why both planes matter
- pure vector retrieval misses exact strings and IDs
- pure keyword retrieval misses conceptual similarity
- pure graph retrieval is awkward for broad fuzzy language
- pure text retrieval is weaker on temporal/entity/stateful questions

The memory system should not force one retrieval paradigm to cosplay all the others.

---

## Validation checklist
- cold start performance acceptable
- first-query model download behavior understood
- graceful degradation verified
- hybrid text retrieval returns exact matches for ID/name queries
- semantic retrieval surfaces conceptually related results
- structured retrieval correctly prefers active assertions over superseded ones
- temporal queries return correct current-vs-historical answers
- contradiction cases remain explainable and source-backed
