# 01 — Memory Foundations, Retrieval Budget, and Runtime Contract (with SurrealDB)

## Audience
This document is written for both human reviewers and agent implementers.

## Why this exists
A memory system for agents has to solve a paradox:
- maintain continuity across sessions
- remember enough to stay coherent over long timelines
- inject little enough context to stay fast, cheap, and accurate

This version assumes a **dual representation model**:
- Markdown is canonical and human-facing
- SurrealDB is the derived structured layer for assertions, entities, provenance, and summaries

---

## 1) Four tiers of memory

## Tier 1 — Working Memory (volatile, in-session)
**Definition**
- the currently active prompt/context window and short rolling summaries

**Failure mode**
- lost at compaction or session reset unless checkpointed

## Tier 2 — Markdown Episodic/Operational Memory (durable, time-indexed)
**Definition**
- day-level logs and operational notes in `memory/YYYY-MM-DD.md`, plus organized markdown files under PARA/bank

**Role**
- canonical source for recent events, task state, and human-editable notes

## Tier 3 — Structured Semantic Memory (derived, query-optimized)
**Definition**
- SurrealDB records derived from markdown/session events, primarily:
  - `episode`
  - `entity`
  - `assertion`
  - `summary`

**Role**
- normalize durable knowledge
- preserve provenance
- support temporal reasoning
- support multi-hop/entity-centric recall

**Examples**
- user preference assertions
- project facts with validity windows
- summaries of entities and sessions
- explicit contradiction/supersession links

## Tier 4 — Curated Identity Memory (high-signal, prompt-friendly)
**Definition**
- `MEMORY.md` plus other compact high-value summaries

**Role**
- stable preferences
- enduring decisions
- identity-level continuity

---

## Tier interactions
- New information should usually **enter as markdown capture** and/or raw `episode` event
- Durable semantic memory should be expressed as `assertion` or `summary`
- Tier 4 should be populated by promotion rules, not by raw chat echo
- Tier 1 should be periodically checkpointed into Tier 2 and reflected into Tier 3 when appropriate

---

## 2) Structured memory object model

## `episode`
An append-only source event.

Examples:
- user message
- assistant reply
- tool result
- imported external note
- daily memory entry

Episodes are the provenance anchor.

## `entity`
A canonical person, project, repo, org, tool, topic, place, or other durable object.

## `assertion`
A structured claim believed by the system.

Examples:
- “Matt prefers Telegram for urgent updates”
- “Project X uses pnpm”
- “Standup moved to 14:15”

Assertions should carry:
- confidence
- salience
- `observed_at`
- `valid_from`
- `valid_to`
- `last_confirmed_at`
- provenance links
- contradiction/supersession state

## `summary`
A compact generated memory product.

Examples:
- entity summary
- session summary
- topic summary
- time-window summary

---

## 3) Retrieval-budget problem

## Core idea
Context rot is mostly a **retrieval-budget allocation problem**.

Even strong retrieval fails if too much low-signal text is injected.

## Budget dimensions
1. token budget
2. snippet/result budget
3. diversity budget
4. freshness budget
5. certainty budget
6. structure budget (how many structured assertions to inject)

## Practical controls
- hard cap snippets and chars per retrieval
- prefer summaries and assertions over raw logs when appropriate
- use MMR/diversity reranking
- apply temporal decay for dated logs
- reserve context for new user intent
- when contradictions exist, inject concise structured conflict state rather than walls of text

## Recommendation (initial)
- memory injection target: ~10–20% of available prompt tokens
- text snippets: top-3 to top-6 unless deep-dive requested
- structured assertions: usually top-2 to top-5 active/current facts per query
- if ambiguity remains high, ask a clarifying question instead of flooding context

---

## 4) Memory Runtime Contract

A runtime contract is the set of invariants every memory write/read path must obey.

## Contract principles
1. **Canonicality** — Markdown files remain source of truth for human-facing durable memory
2. **Derivation** — SurrealDB, vector stores, QMD indexes, and caches are rebuildable derivatives
3. **Budgeted retrieval** — retrieval respects token and snippet ceilings
4. **Promotion discipline** — durable memory writes require quality gates
5. **Scope safety** — visibility follows chat context boundaries
6. **Auditability** — important promotions and assertions are explainable
7. **Provenance** — structured facts must remain traceable to source episodes/notes
8. **Temporal truthfulness** — changed facts are superseded, not silently overwritten

## Contract events
- **capture event** — write high-signal operational facts to daily note and/or episode
- **checkpoint event** — summarize current state for compaction resilience
- **distill event** — compress episodic logs into concise summaries
- **promote event** — create/update durable assertions or curated memory
- **confirm event** — re-observe an existing assertion and refresh confidence/recency
- **supersede event** — replace an older fact with newer evidence
- **contradict event** — preserve conflict state when evidence disagrees
- **prune event** — archive/remove low-value or stale operational noise

---

## 5) Pruning, supersession, and evolution

## Pruning
Pruning is lifecycle management, not just deletion.

Candidates:
- stale todos
- duplicate insights
- low-confidence assertions never reconfirmed
- obsolete project notes moved to archive
- abandoned entities or one-off noise with no supporting value

## Supersession
New revelations should not overwrite history destructively.

### Supersession pattern
- retain original fact with timestamp and provenance
- add replacement assertion with newer timestamp and source
- mark older assertion as superseded
- retrieval prefers newest high-confidence active fact unless historical view is requested

## Contradictions
If conflicting evidence is unresolved:
- preserve both assertions
- mark contradiction relation/state
- downgrade certainty if needed
- prefer clarification or evidence-rich answer assembly

---

## 6) Human cognition parallels

This architecture maps to known cognitive distinctions:
- working memory
- episodic memory
- semantic memory

The agent analogue is:
- store rich history
- retrieve sparse relevance
- preserve belief revision instead of pretending old beliefs never existed

Human memory is reconstructive and error-prone. Agent memory should compensate with:
- timestamps
- confidence
- provenance
- contradiction handling

---

## 7) Retrieval infrastructure in the big picture

## Text retrieval
- builtin memory backend
- QMD where available
- lexical + semantic hybrid retrieval over markdown and summaries

## Structured retrieval
- SurrealDB queries over entities/assertions/summaries
- optimized for:
  - temporal lookup
  - entity-centric recall
  - contradiction-aware recall
  - relationship-heavy questions

## Practical stance
- QMD is not replaced by SurrealDB
- SurrealDB is not a replacement for Markdown
- use both, with clear responsibilities

---

## 8) Orchestrator-Centric Operating Model

### Operating assumption: sub-agent-first execution

The main agent operates primarily as an orchestrator.

**Role split:**
- **Main agent:** planning, decomposition, delegation, integration, memory maintenance, quality control
- **Sub-agents:** scoped task execution and artifact production

**Design consequence:** memory must prioritize:
1. delegated task portfolio state
2. orchestration continuity across compaction/session boundaries
3. reliable integration of sub-agent outcomes into both Markdown and structured memory

### BACKLOG.md vs STATE.md Contract

#### BACKLOG.md
Stable control plane for task lifecycle.

#### STATE.md
Volatile orchestrator cockpit for current focus and in-flight coordination.

### Structured reflection of orchestration state

The system may later derive structured records from backlog/state, but those files remain the primary human-facing control plane.

---

## 9) Implementation implications for the rest of the spec set
- Keep markdown canonicality explicit everywhere
- Add structured extraction targets to capture rules
- Add provenance and assertion lifecycle rules to governance
- Expand retrieval architecture into text + structured planes
- Add SurrealDB-backed structured memory as a planned, phased capability rather than a speculative maybe-later sidebar
