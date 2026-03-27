# 06 — Implementation Roadmap (with SurrealDB)

## Phase 0 (now)
- Create branch structure for spec evolution:
  - `initial-draft/`
  - `with-surrealdb/`
- Preserve current memory behavior
- Document current behavior and gaps
- Lock the conceptual model: markdown canonical, SurrealDB structured, QMD text retrieval

## Phase 1 (foundation)
- Introduce capture tags in daily notes
- Add weekly distillation workflow
- Start minimal PARA folders under `memory/`
- Create `BACKLOG.md` and `STATE.md` with orchestrator contract
- Create `bank/` directory with typed files
- Create `bank/entities/` structure
- Standardize domain taxonomy and sensitivity metadata

## Phase 2 (text retrieval upgrade)
- Pilot QMD backend in a controlled environment
- Tune limits, scope, citations, and fallback behavior
- Benchmark against builtin recall quality

## Phase 2.5 (structured memory foundation)
- Stand up SurrealDB in a pilot environment
- Define initial schema for:
  - `episode`
  - `entity`
  - `assertion`
  - `summary`
  - key relation records (`supports`, `supersedes`, `contradicts`, etc.)
- Implement ingestion from:
  - daily markdown notes
  - selected bank files/entity pages
  - selected session artifacts
- Add basic dedupe and fingerprint logic

## Phase 3 (truth management + governance)
- Add contradiction checks and supersession rules
- Add confirmation/reconfirmation logic
- Add privacy/scope controls to structured memory
- Add monthly memory review checklist
- Define migration conventions for outdated facts

## Phase 4 (dual-plane retrieval)
- Integrate text recall and structured recall into one answer assembly pipeline
- Add query-mode handling:
  - exact lookup
  - conceptual recall
  - temporal recall
  - entity-centric recall
  - contradiction-aware recall
- Track which recall plane actually improved answers

## Phase 5 (agentic expression)
- Link memory outputs to concrete project execution
- Track which recalled notes/assertions actually helped complete tasks
- Close the CODE loop by measuring Express outcomes
- Add optional markdown write-back from structured promotion/summarization

## Phase 6 (cross-project memory maturity)
- Add subject-taxonomy-backed cross-project lessons
- Add shared applicability links where useful
- tighten entity/lesson reuse across projects without flattening scope boundaries
- evaluate whether any additional graph tooling is needed beyond SurrealDB

---

## Open questions
- what is the exact canonical sync contract between markdown and structured memory?
- which captures should auto-promote into assertions vs require review?
- how aggressively should group-derived facts be stored?
- domain taxonomy: inline tags, frontmatter, structured extractor metadata, or all three?
- how should assertion fingerprints be generated and versioned?
- what are the minimum useful query patterns for Phase 2.5 before expanding scope?

---

## Success criteria by milestone

### Foundation complete
- capture and distillation workflows exist and are sustainable

### Text retrieval complete
- QMD meaningfully improves recall quality where enabled

### Structured foundation complete
- selected notes and session artifacts can be ingested into SurrealDB reliably
- assertions are deduped and provenance-backed

### Dual-plane retrieval complete
- temporal/entity/stateful questions outperform text-only recall
- active facts are preferred over superseded ones

### Mature system complete
- memory remains auditable, scoped, and useful across long-running multi-project work
