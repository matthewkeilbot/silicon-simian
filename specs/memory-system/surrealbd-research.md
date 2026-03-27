# SurrealDB Research for AI Agent Memory Systems

_Last updated: 2026-03-27_

## Purpose

This document digests research into:

- OpenClaw's current memory model
- AI agent memory systems such as Letta, Mem0, Graphiti/Zep, and Microsoft GraphRAG
- Graph database patterns for long-term agent memory
- Whether SurrealDB is a good fit for a temporal, provenance-aware agent memory system

> Note: the filename intentionally uses `surrealbd` to match the requested path.

---

## Executive Summary

The strongest pattern across modern agent memory systems is **not** "store everything as chunks" and **not** "just use a graph database." The winning approach is a layered system:

1. **Append-only episodic memory** for raw observations and interactions
2. **Temporal semantic/assertion memory** for extracted facts and relationships
3. **Curated working memory** for small, high-value prompt injection
4. **Hybrid retrieval** combining vector, keyword/full-text, graph traversal, temporal reasoning, and reranking

For optimum retention and recall, the graph schema should model:

- **episodes** as ground-truth source events
- **entities** as canonical nodes
- **assertions/facts** as first-class records with metadata
- **temporal validity** (`observed_at`, `valid_from`, `valid_to`, `last_confirmed_at`)
- **provenance** linking every derived fact back to source episodes
- **supersession/contradiction** rather than destructive overwrite

**SurrealDB looks like a credible fit** because it combines:

- document model
- graph relations
- schemafull tables
- relation tables with metadata
- full-text indexing
- vector/HNSW indexing
- changefeeds

That makes it attractive for an agent memory system where document, graph, vector, and temporal patterns all matter.

---

## Research Constraints / Honesty Note

Browser-based search engine crawling from this environment was partially blocked by anti-bot controls during research:

- Brave Search: captcha / slider challenge
- Google Search: reCAPTCHA / unusual traffic block
- DuckDuckGo: challenge page

So this research was performed using a **source-first methodology**:

- local OpenClaw docs
- direct project docs
- direct browser access to known documentation pages
- GitHub READMEs / raw docs
- arXiv abstracts and project documentation

This is still strong research; it just was not normal SERP scraping.

---

## OpenClaw's Current Memory Model

### What OpenClaw does today

Based on local docs (`docs/concepts/memory.md` and `docs/reference/memory-config.md`):

- Source of truth is **plain Markdown in the workspace**
- Default memory layers:
  - `memory/YYYY-MM-DD.md` for append-only daily notes
  - `MEMORY.md` for curated long-term memory
- Retrieval is semantic search over indexed snippets
- Supports hybrid search and reranking features such as:
  - vector similarity
  - BM25 keyword relevance
  - MMR diversity reranking
  - temporal decay for dated files

### What OpenClaw gets right

- Human-editable memory source of truth
- Easy auditability
- Good operational simplicity
- Strong enough recall for file-first memory
- Explicit distinction between short-term daily memory and curated long-term memory

### Limitations relative to graph-native memory

OpenClaw is not yet modeling memory as a first-class temporal graph. This means it is weaker for:

- tracking how a fact changed over time
- cross-session relational reasoning
- contradiction detection and supersession
- entity-centric multi-hop recall
- explicit provenance graphing beyond snippet retrieval

### Key takeaway for OpenClaw evolution

OpenClaw should not abandon file-based memory. Instead, the strongest design is:

- **Markdown remains canonical and human-editable**
- a graph store is derived from it
- retrieval merges file snippets, graph facts, and summaries

This preserves OpenClaw's best quality — simple truth on disk — while adding relational intelligence.

---

## Letta / MemGPT Findings

### What Letta emphasizes

From Letta docs and README:

- all messages and state are persisted in a database
- important memories are injected as **core memory blocks** into context
- old messages remain retrievable even after leaving the prompt window
- memory is editable by agents and developers

### Architectural lesson

Letta strongly validates the distinction between:

- **persistent memory**
- **prompt memory**

Not all memory belongs in the prompt. Important memory should be pinned or injected selectively, while the broader corpus remains retrievable.

### Implication for schema design

A memory system should explicitly support:

- durable persisted state
- a small working set of pinned/high-value memory
- retrieval paths into older, non-pinned memory

---

## Mem0 Findings

### What Mem0 emphasizes

From Mem0 docs and paper abstract (`arXiv:2504.19413`):

- memory extraction and consolidation rather than full transcript stuffing
- multi-level memory (user, session, agent)
- graph-enhanced memory outperformed base memory by a modest margin
- overall memory architecture outperformed several baselines on LOCOMO
- substantially lower latency and token cost than full-context approaches

### Architectural lesson

Mem0 reinforces three ideas:

1. raw transcript replay is an inefficient substitute for memory
2. extracted memory improves long-term coherence
3. graph representations can improve multi-hop and temporal recall

### Schema implication

Memory systems should not simply store chat logs. They should:

- extract salient memory
- deduplicate / consolidate it
- attach it to users, sessions, and agent-level state
- retrieve a minimal relevant subset at query time

---

## Graphiti / Zep Findings

### Why this is the most relevant external design

Graphiti is the closest match to the target problem: **AI agent memory over changing real-world information**.

From Graphiti docs, README, quickstart, and the Zep paper abstract (`arXiv:2501.13956`):

- memory is modeled as a **temporal context graph**
- core primitives include:
  - entities
  - facts / relationships
  - episodes
  - custom ontology
- facts have validity windows
- provenance links derived knowledge back to episodes
- retrieval is hybrid:
  - semantic search
  - BM25 / keyword search
  - graph traversal / graph-aware reranking
- designed for incremental updates rather than batch-only pipelines

### Why it matters

Graphiti solves the problem that ordinary vector memory does not solve well:

- what is true now?
- what used to be true?
- what changed?
- which evidence supports this fact?
- how do two distant facts connect?

### Most important design lessons from Graphiti

1. **Facts must be temporal**
   - old facts should be invalidated, not deleted
2. **Provenance must be explicit**
   - every derived fact traces to source episodes
3. **Incremental graph construction matters**
   - memory should update continuously, not only via full reindexing
4. **Retrieval must be hybrid**
   - graph, vector, and keyword retrieval are complementary

### Strongest takeaway

If the target is long-running agent memory, **Graphiti-style temporal fact graphs are currently the most convincing design pattern**.

---

## Microsoft GraphRAG Findings

### What GraphRAG does well

GraphRAG focuses on:

- extracting structured graph data from unstructured text
- community clustering and summarization
- better global reasoning over corpora than naive RAG

It is excellent for:

- corpus-wide semantic understanding
- large document collections
- global summaries
- thematic reasoning

### What GraphRAG is less optimized for

Compared to Graphiti-style systems, it is less naturally aligned with:

- constantly changing user memory
- agent interaction history that evolves rapidly
- explicit truth invalidation across time
- per-user/per-agent state management

### Schema lesson

GraphRAG contributes a useful **summary/community layer**, but is less directly useful as the core schema for evolving agent memory.

---

## Core Memory Design Principles

The following principles showed up repeatedly in the research and should be treated as design constraints.

### 1. Separate episodic memory from semantic memory

Do not flatten everything into chunks.

Different kinds of memory need different structure:

- **episodic memory**: what happened and when
- **semantic/assertion memory**: what is believed to be true
- **working memory**: what should be kept prompt-adjacent
- **summary memory**: compressed rollups for large contexts

### 2. Never overwrite reality changes destructively

When a fact changes:

- close the old fact with `valid_to`
- create a new fact with `valid_from`
- link the new fact as superseding the old fact

Destructive overwrite makes historical reasoning impossible.

### 3. Provenance is mandatory

Every derived assertion should point back to one or more source episodes.

Without provenance, the system cannot:

- explain memory origin
- resolve conflicts intelligently
- debug extraction failures
- support evidence-backed answers

### 4. Facts need metadata of their own

A fact is not just a relationship edge. It needs fields like:

- confidence
- salience
- observed time
- validity window
- last confirmation time
- provenance links
- embedding
- extraction metadata

This is why a pure "edge-only" graph is usually too weak for memory.

### 5. Retrieval must be hybrid

The strongest retrieval stack combines:

- vector similarity
- keyword/full-text matching
- graph traversal
- temporal scoring
- salience/confidence weighting
- diversity reranking

Any single retrieval mode alone is insufficient.

### 6. Summaries matter

A good memory system should maintain summaries at useful levels:

- per entity
- per session
- per topic
- per time window

Summary memory is what makes prompt injection practical.

---

## Recommended Logical Schema

### Core objects

#### Agent
Represents the memory-owning assistant or sub-agent.

#### User
Represents a human or external actor.

#### Session / Conversation / Thread
Represents a bounded interaction container.

#### Episode
Represents a raw event:

- user message
- assistant reply
- tool result
- note
- imported event
- observation

Episodes should be append-only and serve as the provenance source.

#### Entity
Represents canonical things:

- people
- organizations
- projects
- repos
- issues
- devices
- places
- concepts
- preferences targets

#### Assertion / Fact
Represents a structured claim about the world.

Examples:

- Matt prefers Telegram for urgent updates
- Project X uses pnpm
- Standup moved from 10:00 to 14:15

#### Summary
Represents a compact rollup over a scope.

#### Topic / Community (optional)
Represents clustered thematic groupings.

---

## Why Assertions Should Be First-Class Records

This is one of the most important schema decisions.

A memory fact should usually be modeled as a **first-class record/node**, not only as a direct edge, because it needs metadata:

- provenance
- confidence
- salience
- timestamps
- temporal validity
- embedding
- supersession state
- contradiction state

A direct relation alone becomes awkward when the relation itself has state and evidence.

Recommended pattern:

- use an `assertion` record for the fact itself
- link it to entities and source episodes with relation tables / edges

---

## Recommended Node / Table Types

### `agent`
Fields:

- `id`
- `name`
- `profile`
- `created_at`

### `user`
Fields:

- `id`
- `canonical_name`
- `aliases[]`
- `profile_summary`
- `created_at`
- `updated_at`

### `session`
Fields:

- `id`
- `channel`
- `thread_key`
- `started_at`
- `ended_at`
- `summary`

### `episode`
Fields:

- `id`
- `session`
- `kind`
- `speaker`
- `content`
- `structured_payload`
- `source_ref`
- `timestamp`
- `embedding`
- `salience`
- `privacy_scope`

### `entity`
Fields:

- `id`
- `entity_type`
- `canonical_name`
- `aliases[]`
- `summary`
- `status`
- `embedding`
- `created_at`
- `updated_at`
- `last_seen_at`
- `salience`

### `assertion`
Fields:

- `id`
- `subject`
- `predicate`
- `object_entity` (nullable)
- `object_value` (nullable)
- `text`
- `confidence`
- `salience`
- `observed_at`
- `valid_from`
- `valid_to`
- `last_confirmed_at`
- `state` (`active`, `superseded`, `contradicted`, `uncertain`)
- `embedding`
- `fingerprint`
- `created_at`
- `updated_at`

### `summary`
Fields:

- `id`
- `scope_type`
- `scope_id`
- `text`
- `time_start`
- `time_end`
- `embedding`
- `generated_at`
- `version`

---

## Recommended Relationship Types

### Structural / provenance relationships

- `session -> contains -> episode`
- `episode -> mentions -> entity`
- `episode -> supports -> assertion`
- `summary -> summarizes -> entity`
- `summary -> summarizes -> session`
- `summary -> summarizes -> topic`

### Semantic relationships

- `assertion -> about -> entity`
- `entity -> related_to -> entity`
- additional domain-specific relations as useful

### Truth-management relationships

- `assertion -> supersedes -> assertion`
- `assertion -> contradicts -> assertion`
- `assertion -> confirms -> assertion`

This truth-management layer is critical for memory integrity.

---

## Retrieval Strategy for Optimum Recall

### Query classification

At retrieval time, classify queries into categories such as:

- entity lookup
- episodic recall
- temporal change
- preference/profile recall
- multi-hop reasoning
- broad summary

### Candidate generation

Search in parallel over:

- assertions by vector similarity
- assertions by full-text / BM25
- episodes by vector similarity
- episodes by full-text / BM25
- summaries by vector similarity
- graph neighborhoods from matched entities/assertions

### Reranking

Score and rerank using:

- semantic relevance
- full-text relevance
- graph distance
- recency / temporal fit
- salience
- confidence
- provenance count / evidence quality
- superseded vs active state

### Diversity control

Use diversity reranking such as MMR to avoid result duplication.

### Answer assembly

- specific query -> return assertions plus supporting episodes
- temporal query -> return chronological assertion chain
- broad query -> return summary plus evidence
- contradiction query -> return competing assertions and supersession state

---

## SurrealDB-Specific Findings

### What SurrealDB offers that is directly useful

From SurrealDB docs and README:

- multi-model storage
- graph relations via `RELATE`
- relation tables with `in` / `out` and additional metadata
- schemafull tables via `DEFINE TABLE`
- record references / record types
- full-text indexes
- HNSW vector indexes
- changefeeds
- one-engine document + graph + search + vector architecture

### Strong fit for agent memory

SurrealDB appears well-suited for a memory system that needs:

- graph traversal
- vector search
- full-text retrieval
- structured records
- temporal metadata
- schema validation
- change tracking

### Important SurrealDB lesson from docs

SurrealDB relation tables are better than plain record links when:

- the relationship itself has metadata
- you want bidirectional traversal
- you want separate indexing / schema control for the relation
- you want the graph relation to be a first-class object

This matches memory design very well.

### Why SurrealDB is attractive here

Instead of stitching together:

- Postgres for documents
- Neo4j for graph
- Elasticsearch for full-text
- a vector store for embeddings

SurrealDB potentially allows a simpler integrated system.

### Caveats

- vector/HNSW tuning still requires careful operational testing
- graph traversal and reranking logic still belongs partly in the application layer
- schema flexibility can lead to bad data models if not tightly controlled
- Neo4j still has a more mature graph-specific ecosystem

### Overall verdict on SurrealDB

SurrealDB is a **serious candidate** for agent memory, especially if the goal is a unified engine with:

- graph relations
- document storage
- vector retrieval
- full-text retrieval
- temporal metadata

---

## Recommended SurrealDB Modeling Approach

### Do not model everything as plain links

Use:

- **normal tables** for core memory objects
- **relation tables** for explicit relationships that carry metadata

### Recommended core tables

- `agent`
- `user`
- `session`
- `episode`
- `entity`
- `assertion`
- `summary`
- `topic` (optional)

### Recommended relation tables

- `contains`
- `mentions`
- `supports`
- `about`
- `related_to`
- `supersedes`
- `contradicts`
- `summarizes`

### Why this is stronger than edge-only design

An edge-only design becomes awkward for:

- assertions with literal values
- assertions with multiple supporting episodes
- contradiction resolution
- deduplication
- embeddings on assertions
- confidence / salience on facts

So the best SurrealDB pattern is:

- **assertions are records**
- **relations connect assertions, entities, sessions, and episodes**

---

## Recommended Index Strategy

### For identity and deduplication

- unique index on canonical entity identity where possible
- unique or near-unique fingerprint index on assertions
- composite unique indexes on relation tables where duplicates are forbidden

### For retrieval

- full-text index on `episode.content`
- full-text index on `assertion.text`
- full-text index on `summary.text`
- HNSW on `episode.embedding`
- HNSW on `assertion.embedding`
- HNSW on `summary.embedding`

### For time-sensitive queries

- indexes on `assertion.valid_from`
- indexes on `assertion.valid_to`
- indexes on `assertion.observed_at`
- indexes on relation timestamps when relation recency matters

---

## Final Conclusions

### Best architectural pattern

The strongest architecture is:

1. **Append-only episodes** as provenance source
2. **Temporal assertions** as first-class knowledge records
3. **Entity graph** for relational organization
4. **Summary layer** for prompt-efficient recall
5. **Hybrid retrieval** for search and reasoning

### Best truth-management principle

Never delete old truths when new truths arrive.

Instead:

- close the old truth with `valid_to`
- create the new truth with `valid_from`
- link new to old with `supersedes`

### Best SurrealDB modeling principle

Use SurrealDB as a **multi-model memory substrate**, not as a generic dump for blobs.

That means:

- schemafull tables
- strong assertion modeling
- explicit provenance
- explicit temporal semantics
- relation tables with metadata
- indexed retrieval surfaces

### Most important one-line conclusion

For optimum memory retention and recall, **store temporal, provenance-linked assertions derived from append-only episodes, then retrieve them with hybrid vector + keyword + graph search.**

---

## Source Notes

### Local OpenClaw docs

- `docs/concepts/memory.md`
- `docs/reference/memory-config.md`

### External project docs / papers / READMEs

- Letta docs on stateful agents
- Letta README
- Mem0 README and paper abstract (`arXiv:2504.19413`)
- Graphiti README, quickstart, and Zep paper abstract (`arXiv:2501.13956`)
- Microsoft GraphRAG docs / README
- SurrealDB docs for:
  - `RELATE`
  - `DEFINE TABLE`
  - `DEFINE INDEX`
  - vector functions / kNN / HNSW
- SurrealDB README
