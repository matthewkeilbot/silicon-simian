# SurrealDB Memory System Spec Idea

_Last updated: 2026-03-27_

## Purpose

This document proposes a concrete implementation direction for a SurrealDB-backed memory system for OpenClaw or a similar long-running AI agent platform.

It is intentionally a **spec idea**, not a final implementation contract. The goal is to move from research findings into a shape that could realistically be prototyped.

> Note: the filename intentionally uses `surrealbd` to match the requested path.

---

## High-Level Goal

Build an agent memory system that:

- preserves raw memory events durably
- supports temporal fact evolution
- supports cross-session recall
- enables evidence-backed answers
- keeps prompt memory compact
- combines vector, full-text, and graph retrieval in one system
- stays auditable and explainable

For OpenClaw specifically, the ideal design should **augment**, not destroy, the existing Markdown memory model.

---

## Proposed System Architecture

### Source-of-truth strategy

Recommended strategy:

- keep existing Markdown memory (`MEMORY.md`, `memory/YYYY-MM-DD.md`) as human-editable durable memory
- ingest memory files and session events into SurrealDB as structured records
- derive graph and retrieval surfaces from those sources
- optionally round-trip some curated facts/summaries back into Markdown for auditability

### Why not replace Markdown outright?

Because Markdown gives us:

- easy inspection
- manual editing
- backup simplicity
- trustable durability
- low operational risk

The graph database should be a **derived intelligence layer**, not the only truth container.

---

## Target Memory Layers

### Layer 1: Episodic memory

Append-only raw observations.

Examples:

- user message
- assistant reply
- tool result
- daily note entry
- imported calendar event
- imported issue / PR / external note

Primary goal:

- preserve provenance
- enable chronological recall
- support re-extraction or re-interpretation later

### Layer 2: Semantic / assertion memory

Extracted structured knowledge.

Examples:

- user preferences
- project facts
- repo facts
- meeting changes
- factual claims about entities

Primary goal:

- normalize what the system believes
- support temporal truth management
- support multi-hop recall

### Layer 3: Summary / working memory

Compressed high-value memory.

Examples:

- current active projects
- current user preferences
- current unresolved blockers
- session summaries
- topic summaries

Primary goal:

- prompt-efficient injection
- fast broad recall
- reduce token waste

---

## Proposed SurrealDB Data Model

## Core tables

### `agent`
Represents the AI agent or sub-agent that owns memory.

Suggested fields:

- `id`
- `name`
- `profile`
- `created_at`
- `updated_at`

### `user`
Represents a human or external actor.

Suggested fields:

- `id`
- `canonical_name`
- `aliases`
- `summary`
- `created_at`
- `updated_at`

### `session`
Represents a bounded interaction context.

Suggested fields:

- `id`
- `channel`
- `chat_id`
- `thread_key`
- `surface`
- `started_at`
- `ended_at`
- `summary`
- `metadata`

### `episode`
Represents a raw event or memory atom.

Suggested fields:

- `id`
- `session_id`
- `source_type`
  - `message`
  - `tool_result`
  - `daily_note`
  - `external_event`
  - `imported_doc`
- `speaker_type`
  - `user`
  - `agent`
  - `tool`
  - `system`
- `speaker_ref`
- `content`
- `structured_payload`
- `source_ref`
- `privacy_scope`
- `timestamp`
- `embedding`
- `salience`
- `ingest_run_id`
- `created_at`

### `entity`
Represents canonical people, projects, repos, issues, devices, concepts, orgs, etc.

Suggested fields:

- `id`
- `entity_type`
- `canonical_name`
- `aliases`
- `summary`
- `embedding`
- `status`
- `attributes`
- `first_seen_at`
- `last_seen_at`
- `created_at`
- `updated_at`

### `assertion`
Represents structured claims the memory system believes.

Suggested fields:

- `id`
- `subject_entity_id`
- `predicate`
- `object_entity_id` (nullable)
- `object_value` (nullable)
- `text`
- `confidence`
- `salience`
- `state`
  - `active`
  - `superseded`
  - `contradicted`
  - `uncertain`
- `observed_at`
- `valid_from`
- `valid_to`
- `last_confirmed_at`
- `fingerprint`
- `embedding`
- `extraction_model`
- `extraction_version`
- `created_at`
- `updated_at`

### `summary`
Represents generated summaries.

Suggested fields:

- `id`
- `scope_type`
  - `session`
  - `entity`
  - `topic`
  - `time_window`
  - `agent`
- `scope_id`
- `text`
- `embedding`
- `time_start`
- `time_end`
- `generated_at`
- `generator`
- `version`

### `topic`
Optional but useful for clustered memory.

Suggested fields:

- `id`
- `name`
- `summary`
- `embedding`
- `created_at`
- `updated_at`

---

## Proposed relation tables

These should be explicit SurrealDB relation tables so they can carry metadata and be traversed efficiently.

### `contains`
Links:
- `session -> episode`

Useful metadata:
- `ordinal`
- `created_at`

### `mentions`
Links:
- `episode -> entity`

Useful metadata:
- `confidence`
- `mention_text`
- `created_at`

### `supports`
Links:
- `episode -> assertion`

Useful metadata:
- `confidence`
- `source_span`
- `created_at`

### `about`
Links:
- `assertion -> entity`

Useful metadata:
- `role`
  - `subject`
  - `object`
  - `secondary`
- `created_at`

### `related_to`
Links:
- `entity -> entity`

Useful metadata:
- `predicate`
- `confidence`
- `valid_from`
- `valid_to`
- `created_at`

### `supersedes`
Links:
- `assertion -> assertion`

Useful metadata:
- `reason`
- `created_at`

### `contradicts`
Links:
- `assertion -> assertion`

Useful metadata:
- `confidence`
- `reason`
- `created_at`

### `summarizes`
Links:
- `summary -> entity/session/topic/assertion`

Useful metadata:
- `coverage`
- `created_at`

### `participant_in`
Links:
- `user -> session`
- `agent -> session`

Useful metadata:
- `role`
- `created_at`

---

## Suggested SurrealDB DDL Shape

This is intentionally illustrative rather than production-final.

```sql
DEFINE TABLE agent SCHEMAFULL;
DEFINE TABLE user SCHEMAFULL;
DEFINE TABLE session SCHEMAFULL CHANGEFEED 30d;
DEFINE TABLE episode SCHEMAFULL CHANGEFEED 30d;
DEFINE TABLE entity SCHEMAFULL;
DEFINE TABLE assertion SCHEMAFULL CHANGEFEED 30d;
DEFINE TABLE summary SCHEMAFULL;
DEFINE TABLE topic SCHEMAFULL;

DEFINE TABLE contains SCHEMAFULL TYPE RELATION IN session OUT episode ENFORCED;
DEFINE TABLE mentions SCHEMAFULL TYPE RELATION IN episode OUT entity ENFORCED;
DEFINE TABLE supports SCHEMAFULL TYPE RELATION IN episode OUT assertion ENFORCED;
DEFINE TABLE about SCHEMAFULL TYPE RELATION IN assertion OUT entity ENFORCED;
DEFINE TABLE related_to SCHEMAFULL TYPE RELATION IN entity OUT entity ENFORCED;
DEFINE TABLE supersedes SCHEMAFULL TYPE RELATION IN assertion OUT assertion ENFORCED;
DEFINE TABLE contradicts SCHEMAFULL TYPE RELATION IN assertion OUT assertion ENFORCED;
DEFINE TABLE summarizes SCHEMAFULL TYPE RELATION IN summary OUT entity ENFORCED;
```

This would later need to be expanded with field definitions and assertions.

---

## Suggested Field Definitions (Illustrative)

```sql
DEFINE FIELD canonical_name ON TABLE entity TYPE string;
DEFINE FIELD entity_type ON TABLE entity TYPE string;
DEFINE FIELD aliases ON TABLE entity TYPE array<string>;
DEFINE FIELD summary ON TABLE entity TYPE option<string>;
DEFINE FIELD embedding ON TABLE entity TYPE option<array<float>>;
DEFINE FIELD attributes ON TABLE entity TYPE option<object>;
DEFINE FIELD first_seen_at ON TABLE entity TYPE option<datetime>;
DEFINE FIELD last_seen_at ON TABLE entity TYPE option<datetime>;

DEFINE FIELD source_type ON TABLE episode TYPE string;
DEFINE FIELD content ON TABLE episode TYPE string;
DEFINE FIELD structured_payload ON TABLE episode TYPE option<object>;
DEFINE FIELD source_ref ON TABLE episode TYPE option<object>;
DEFINE FIELD privacy_scope ON TABLE episode TYPE option<string>;
DEFINE FIELD timestamp ON TABLE episode TYPE datetime;
DEFINE FIELD embedding ON TABLE episode TYPE option<array<float>>;
DEFINE FIELD salience ON TABLE episode TYPE option<float>;

DEFINE FIELD predicate ON TABLE assertion TYPE string;
DEFINE FIELD text ON TABLE assertion TYPE string;
DEFINE FIELD object_value ON TABLE assertion TYPE option<any>;
DEFINE FIELD confidence ON TABLE assertion TYPE option<float>;
DEFINE FIELD salience ON TABLE assertion TYPE option<float>;
DEFINE FIELD state ON TABLE assertion TYPE string;
DEFINE FIELD observed_at ON TABLE assertion TYPE option<datetime>;
DEFINE FIELD valid_from ON TABLE assertion TYPE option<datetime>;
DEFINE FIELD valid_to ON TABLE assertion TYPE option<datetime>;
DEFINE FIELD last_confirmed_at ON TABLE assertion TYPE option<datetime>;
DEFINE FIELD fingerprint ON TABLE assertion TYPE string;
DEFINE FIELD embedding ON TABLE assertion TYPE option<array<float>>;
```

---

## Suggested Index Strategy

## Identity and deduplication

```sql
DEFINE INDEX entity_name_unique ON TABLE entity COLUMNS canonical_name UNIQUE;
DEFINE INDEX assertion_fingerprint_unique ON TABLE assertion COLUMNS fingerprint UNIQUE;
DEFINE INDEX mentions_unique ON TABLE mentions COLUMNS in, out UNIQUE;
DEFINE INDEX supports_unique ON TABLE supports COLUMNS in, out UNIQUE;
```

The exact uniqueness rules may need refinement by namespace or entity type.

## Full-text retrieval

```sql
DEFINE ANALYZER memory_analyzer TOKENIZERS class FILTERS lowercase, ascii;
DEFINE INDEX episode_content_fts ON TABLE episode COLUMNS content FULLTEXT ANALYZER memory_analyzer BM25;
DEFINE INDEX assertion_text_fts ON TABLE assertion COLUMNS text FULLTEXT ANALYZER memory_analyzer BM25;
DEFINE INDEX summary_text_fts ON TABLE summary COLUMNS text FULLTEXT ANALYZER memory_analyzer BM25;
```

## Vector retrieval

Illustrative only; dimensionality must match the chosen embedding model.

```sql
DEFINE INDEX episode_embedding_hnsw ON TABLE episode COLUMNS embedding HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
DEFINE INDEX assertion_embedding_hnsw ON TABLE assertion COLUMNS embedding HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
DEFINE INDEX summary_embedding_hnsw ON TABLE summary COLUMNS embedding HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
DEFINE INDEX entity_embedding_hnsw ON TABLE entity COLUMNS embedding HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
```

## Temporal indexes

```sql
DEFINE INDEX assertion_valid_from_idx ON TABLE assertion COLUMNS valid_from;
DEFINE INDEX assertion_valid_to_idx ON TABLE assertion COLUMNS valid_to;
DEFINE INDEX assertion_observed_at_idx ON TABLE assertion COLUMNS observed_at;
DEFINE INDEX episode_timestamp_idx ON TABLE episode COLUMNS timestamp;
```

---

## Memory Ingestion Pipeline

## Phase 1: Collect source events

Input sources:

- Markdown memory files
- session transcripts
- tool results
- optional external systems
  - GitHub
  - calendar
  - issue trackers
  - CRM / docs / knowledge bases

Each ingested item becomes one or more `episode` records.

## Phase 2: Entity extraction

From each episode, extract candidate entities:

- people
- repos
- projects
- concepts
- devices
- times / places / organizations

Then:

- canonicalize against existing entities
- create new entities when confidence warrants it
- link `episode -> mentions -> entity`

## Phase 3: Assertion extraction

From the same episode, extract structured assertions.

Examples:

- user preference
- project state
- meeting change
- relationship between entities

Then:

- generate assertion fingerprint
- dedupe against existing active assertions
- if same truth: update `last_confirmed_at`
- if changed truth: create new assertion and mark supersession
- link `episode -> supports -> assertion`

## Phase 4: Summary generation

Generate summaries periodically for:

- sessions
- entities
- topics
- time windows

Store as `summary` records and connect via `summarizes` relations.

## Phase 5: Optional Markdown write-back

For OpenClaw alignment, periodically write selected durable outputs back to:

- `memory/YYYY-MM-DD.md`
- `MEMORY.md`

Examples:

- new stable preference discovered
- active project summary updated
- high-confidence durable fact learned

---

## Assertion Lifecycle Rules

This is the most important behavioral piece.

## Rule 1: never destructive-overwrite an assertion

When truth changes:

- old assertion gets `valid_to`
- old assertion state becomes `superseded`
- new assertion is created with `valid_from`
- `new_assertion -> supersedes -> old_assertion`

## Rule 2: preserve supporting evidence

Assertions should accumulate support over time via `supports` links from episodes.

## Rule 3: allow contradictions without immediate deletion

If conflicting evidence exists and certainty is unclear:

- preserve both assertions
- mark contradiction relation
- downgrade confidence or mark `uncertain`
- wait for more evidence or higher-confidence resolution

## Rule 4: support re-confirmation

If a known active assertion is re-observed:

- bump `last_confirmed_at`
- optionally bump confidence / salience
- do not create duplicate assertions if the fingerprint matches

---

## Query / Retrieval Plan

## Query classification

At query time classify the intent:

- factual lookup
- preference recall
- temporal change
- multi-hop reasoning
- episodic recall
- broad summary

## Candidate generation

Run retrieval in parallel:

1. vector search over `assertion`
2. full-text search over `assertion`
3. vector search over `episode`
4. full-text search over `episode`
5. vector/full-text search over `summary`
6. graph expansion from top-matched entities/assertions

## Reranking features

Combine:

- semantic similarity
- full-text rank
- graph distance
- assertion state (`active` > `uncertain` > `superseded` for current queries)
- temporal fitness
- salience
- confidence
- provenance count
- source quality

## Diversity control

Apply diversity reranking so results are not near-duplicates.

## Answer assembly modes

### factual question
Return:
- best assertion(s)
- supporting episodes
- confidence / recency metadata

### temporal question
Return:
- timeline of assertions ordered by `valid_from`
- supersession chain
- supporting episodes

### broad question
Return:
- summary first
- top evidence second

### contradiction question
Return:
- competing assertions
- conflict markers
- evidence supporting each
- preferred/active assertion if one exists

---

## OpenClaw Integration Idea

## Minimal integration path

### Step 1: keep current memory unchanged

Do not break existing:

- Markdown memory files
- current semantic search
- current agent memory prompts

### Step 2: add background ingestion into SurrealDB

A background worker can watch:

- Markdown memory changes
- session transcripts
- optional additional sources

### Step 3: add a graph-aware retrieval layer

Expose a new retrieval path that merges:

- Markdown snippet results
- graph assertions
- summary results
- graph neighbors

### Step 4: add memory promotion rules

Promote durable graph facts into:

- `MEMORY.md`
- current prompt memory blocks
- summary records

### Step 5: add debugging views

Need visibility into:

- why an assertion exists
- what episodes support it
- what it superseded
- why a retrieval result ranked highly

This is essential. Otherwise debugging turns into ritual sacrifice.

---

## Suggested Implementation Phases

## Phase 0: design + constraints

Deliverables:

- finalize schema
- choose embedding model and dimension
- choose confidence/salience rules
- define assertion fingerprinting approach

## Phase 1: local prototype

Deliverables:

- SurrealDB instance running locally
- DDL for core tables and indexes
- basic episode/entity/assertion insert flow
- simple vector/full-text retrieval

Success criteria:

- can ingest sample memory files and chat episodes
- can retrieve assertions and support evidence

## Phase 2: temporal truth management

Deliverables:

- supersession logic
- contradiction logic
- re-confirmation logic
- timeline queries

Success criteria:

- changed facts remain historically queryable
- current truths are easy to identify

## Phase 3: hybrid retrieval + reranking

Deliverables:

- query classification
- retrieval orchestration
- graph expansion
- scoring and reranking

Success criteria:

- multi-hop and temporal queries beat baseline snippet retrieval

## Phase 4: OpenClaw integration

Deliverables:

- background ingestion from workspace memory + sessions
- graph-aware search interface
- optional Markdown write-back

Success criteria:

- backwards compatibility with existing memory workflow
- improved recall on long-running contexts

## Phase 5: summaries and maintenance jobs

Deliverables:

- summary generation
- stale assertion review
- entity merge jobs
- memory health dashboards

Success criteria:

- long-term memory quality remains stable as data volume grows

---

## Open Questions

These need answers before implementation hardens.

### 1. What is canonical truth?

Options:
- Markdown canonical, SurrealDB derived
- SurrealDB canonical, Markdown exported
- dual-write with reconciliation

My recommendation:
- Markdown canonical for human-facing durable memory
- SurrealDB canonical for structured retrieval state
- use careful synchronization rules

### 2. How aggressive should extraction be?

If too aggressive:
- memory fills with junk

If too conservative:
- recall stays weak

Need thresholds around:
- salience
- confidence
- recurrence
- entity type
- user importance

### 3. What should be embedded?

Likely yes:
- episodes
- assertions
- summaries
- optionally entities

Need to confirm storage/perf tradeoffs.

### 4. How should fingerprints be generated?

Need a stable scheme based on normalized:
- subject
- predicate
- object
- time bucket or scope where appropriate

### 5. How should prompt memory be assembled?

Potential strategy:
- current entity/profile facts
- active project facts
- recent relevant episodes
- current topic summary

Need explicit token budget policy.

---

## Recommended First Prototype Scope

Keep the first build narrow.

### Scope

Implement only:

- `episode`
- `entity`
- `assertion`
- `summary`
- `session`
- relations:
  - `mentions`
  - `supports`
  - `supersedes`
  - `summarizes`

### Input sources

Only ingest:

- `MEMORY.md`
- `memory/YYYY-MM-DD.md`
- selected session transcripts

### Retrieval modes

Support only:

- current fact lookup
- temporal fact history
- preference recall
- session summary recall

This keeps the prototype honest and measurable.

---

## Metrics for Success

We should not call this better just because it feels fancier.

Track:

- retrieval precision for factual queries
- recall for multi-hop queries
- accuracy for temporal change queries
- answer evidence coverage
- prompt token savings vs transcript-heavy baselines
- latency by query type
- duplicate assertion rate
- contradiction resolution rate
- manual correction rate

---

## Recommended Position

### Final recommendation

Build a **SurrealDB-backed derived memory layer** that models:

- append-only episodes
- temporal assertions
- explicit provenance
- explicit supersession
- summary records
- hybrid retrieval surfaces

while preserving OpenClaw's existing Markdown memory model.

### What to avoid

Do **not**:

- store only chunks
- overwrite facts in place
- hide provenance
- depend on vector search alone
- let the schema go schemaless chaos mode
- pretend graph structure automatically solves retrieval ranking

### Sharpest one-line plan

Prototype a SurrealDB memory layer where **episodes are immutable evidence, assertions are temporal truth records, summaries are prompt-facing memory, and retrieval merges vector + full-text + graph traversal**.

---

## Next Suggested Deliverable

If proceeding, the next artifact should be a real implementation draft such as:

- `surrealbd-schema.sql`
- or a richer technical spec with:
  - exact field types
  - fingerprint logic
  - ingestion pseudocode
  - retrieval scoring formula
  - OpenClaw integration points
