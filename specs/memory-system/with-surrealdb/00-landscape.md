# 00 — Memory Landscape Review & Critical Design Analysis (with SurrealDB)

## Purpose

Synthesize relevant memory-system patterns from adjacent agent ecosystems and evaluate design choices for an OpenClaw memory architecture that is robust under compaction, token constraints, long-running usage, and multi-project operation.

This version assumes **SurrealDB is a first-class candidate** for the structured memory layer.

---

## Sources reviewed

### OpenClaw-native
- OpenClaw docs: `docs/concepts/memory.md`
  - Markdown source of truth (`memory/YYYY-MM-DD.md`, `MEMORY.md`)
  - `memory_search` + `memory_get`
  - Optional QMD backend with fallback to builtin
  - Hybrid search, MMR, temporal decay, and scope controls

### External ecosystems
- Tiago Forte / BASB: CODE + PARA + Progressive Summarization
- QMD project (hybrid local retrieval + reranking)
- Letta/MemGPT family (stateful agents, memory blocks, explicit memory management)
- Mem0 (multi-level memory, extraction/promotion, graph-assisted improvements)
- Graphiti / Zep (temporal context graphs for agent memory)
- Microsoft GraphRAG ecosystem
- SurrealDB docs and implementation patterns
- Obsidian-style note graph conventions (link-first, backlink-heavy workflows)

> Note: web SERP research was partially blocked by anti-bot challenges in this environment, so research used direct docs, browser access to known pages, local OpenClaw docs, and project READMEs.

---

## What other systems are optimizing for

## 1) BASB / Obsidian-style systems (human-first PKM)
**Strengths**
- Excellent for human readability and gradual distillation
- Strong future discoverability when notes are linked and summarized
- Low lock-in (plain markdown)

**Weaknesses for agents**
- Manual upkeep burden
- Link graphs can become noisy without governance
- Retrieval quality degrades if summarization discipline slips

**Design lesson**
- Keep markdown as source of truth
- Enforce lightweight structure and repeatable tags/templates
- Do not make humans debug opaque memory machinery for ordinary recall

## 2) QMD / hybrid retrieval systems
**Strengths**
- Strong retrieval quality from keyword + semantic + rerank combination
- Better robustness on exact-token queries than vector-only retrieval
- Local-first privacy posture

**Weaknesses**
- Operational complexity (models, indexing cadence, warmup, runtime deps)
- Cold-start latency and model download overhead

**Design lesson**
- Use hybrid text retrieval as a first-class recall plane
- Keep graceful fallback to simpler backend
- Treat QMD as the **text search engine**, not the whole memory system

## 3) Letta/MemGPT-style memory hierarchies
**Strengths**
- Explicit short-term vs long-term memory semantics
- Clear mechanisms for promotion and summarization
- Strong separation between persistent memory and prompt memory

**Weaknesses**
- Framework-specific abstractions can be harder to inspect
- Hidden or implicit memory mutations can reduce auditability

**Design lesson**
- Promotion pipeline must be explicit and auditable
- Important memory should be pinned selectively; not everything belongs in prompt context

## 4) Graphiti / temporal graph approaches
**Strengths**
- Strong for entity-centric, temporal, multi-hop recall
- Facts evolve over time without historical loss
- Provenance is explicit
- Better match for long-running agent memory than static document-only systems

**Weaknesses**
- Extraction quality matters a lot
- Graph construction and truth maintenance add complexity
- Easy to overbuild before capture quality is good enough

**Design lesson**
- Use graph/document structure for **assertions, entities, provenance, and summaries**
- Do not graph everything indiscriminately
- Make temporal validity and supersession first-class concepts

## 5) SurrealDB as structured memory substrate
**Strengths**
- Native multi-model approach: document + graph + vector + full-text
- Relation records can carry metadata
- Schemafull tables help prevent chaos
- Changefeeds are useful for maintenance and downstream sync
- Good fit for a derived structured memory layer beside Markdown

**Weaknesses**
- Still requires careful schema discipline
- Retrieval quality still depends on application-side ranking strategy
- More moving parts than file-only memory

**Design lesson**
- SurrealDB is not just a graph toy; it is a viable structured memory substrate
- Use it for memory that benefits from structure:
  - entities
  - assertions/facts
  - provenance links
  - summaries
  - contradiction/supersession

---

## Critical design decisions (and tradeoffs)

## A. Source of truth: Markdown vs database-first
- **Decision:** Keep markdown as canonical source; SurrealDB, QMD, and other indexes are derived layers
- **Why:** transparency, portability, debuggability, easy human co-editing
- **Tradeoff:** more work to maintain derived state

## B. Retrieval quality: vector-only vs hybrid
- **Decision:** hybrid text retrieval (BM25 + vector + rerank) for medium+ corpora
- **Why:** protects exact-match retrieval while preserving semantic recall
- **Tradeoff:** more compute and tuning complexity

## C. Memory tiers: 2-layer vs 3+ layers
- **Decision:** practical 4-layer model:
  1. volatile working context
  2. markdown episodic/operational memory
  3. structured semantic memory in SurrealDB
  4. curated identity/long-term memory (`MEMORY.md` + summaries)
- **Why:** better compaction resilience and cleaner separation of duties

## D. Promotion policy: automatic vs human-confirmed
- **Decision:** semi-automatic promotion with confidence + contradiction checks
- **Why:** full-auto risks memory pollution; full-manual loses consistency

## E. Structured memory timing
- **Decision:** design for structured memory immediately; roll it out in phases
- **Why:** retrofitting provenance/temporal semantics later is painful
- **Clarification:** this does **not** mean graphing everything from day one

---

## Recommended architecture for OpenClaw

## Tier 0 — Working memory (volatile)
- Current conversation + compacted summaries
- Never trusted as durable long-term truth on its own

## Tier 1 — Markdown episodic memory (durable logs)
- `memory/YYYY-MM-DD.md`
- Structured capture bullets (`[decision]`, `[preference]`, `[todo]`, `[insight]`, `[context]`)
- Primary sink for new facts and task continuity

## Tier 2 — Organized markdown knowledge (operational bank)
- PARA folders under `memory/`
- `bank/` typed files and entity pages
- Weekly or periodic distillation from daily notes

## Tier 3 — Structured memory in SurrealDB
- `episode` records for raw events/provenance
- `entity` records for canonical actors/objects/topics
- `assertion` records for structured facts with confidence and validity windows
- `summary` records for compressed memory products
- relation records for provenance, contradiction, supersession, applicability, and relevance

## Tier 4 — Identity & durable curation
- `MEMORY.md`
- highly curated, stable preferences, key decisions, enduring context

## Retrieval plane
Two cooperating planes:

### Plane A — text retrieval
- OpenClaw builtin memory backend
- optional QMD backend
- hybrid text recall over markdown files and summaries

### Plane B — structured retrieval
- SurrealDB queries over assertions/entities/summaries/relations
- optimized for temporal questions, entity-centric recall, contradiction handling, and multi-hop reasoning

Unified answer assembly should merge outputs from both planes.

---

## Compaction and context-rot mitigation

## Problem 1: compaction memory loss
**Mitigations**
1. Pre-compaction flush (already supported in OpenClaw) with stricter promotion checklist
2. Add checkpoint notes at major task boundaries:
   - current goal
   - decisions made
   - next actions
   - blockers
3. Rehydrate from both:
   - markdown checkpoints
   - active structured assertions/summaries in SurrealDB

## Problem 2: context overpopulation / context rot
**Mitigations**
1. Retrieval budget contract:
   - fixed max snippets and chars per turn
   - prefer distilled/structured memory over raw logs when available
2. Freshness weighting:
   - favor recent daily notes unless query is historical
3. Diversity rerank (MMR):
   - avoid repeated context
4. Contradiction-aware selection:
   - if conflicting memories found, inject both with timestamps and confidence
5. Need-to-know rehydration:
   - retrieve only memory relevant to the current user intent

---

## Where SurrealDB pays for itself

## Good fit
- temporal fact queries: “what changed?”
- entity-centric recall: “what do we know about X?”
- cross-project transferable lessons and patterns
- provenance-backed answers
- contradiction and supersession handling
- relationship-heavy task memory

## Poor fit
- dumping all raw chat into a graph with no extraction discipline
- replacing Markdown just because databases look sexy in diagrams
- tiny corpora where file search already answers everything cheaply

## Recommendation
- SurrealDB should be a **planned first-class layer**, not a speculative afterthought
- but use it selectively for structured memory, not as a universal container for every note fragment

---

## Acceptance criteria
1. **Recall precision:** top-3 memory results include at least one directly actionable item for common tasks
2. **Compaction resilience:** post-compaction restart recovers active project state in <=1 retrieval pass
3. **Temporal correctness:** superseded facts do not masquerade as current truth
4. **Token discipline:** memory injection remains within a predefined budget per turn
5. **Low pollution:** durable promotions have low contradiction and duplicate rates
6. **Privacy safety:** no structured-memory leakage across context boundaries
7. **Cross-project reuse:** transferable lessons can be surfaced without manually scanning unrelated project notes

---

## Recommended next implementation steps
1. Establish orchestrator-centric model: BACKLOG.md + STATE.md as first-class files
2. Add `memory/projects|areas|resources|archive` structure
3. Create typed bank and entity pages in markdown
4. Introduce capture tags in daily memory notes with domain taxonomy metadata
5. Define the structured-memory schema:
   - `episode`
   - `entity`
   - `assertion`
   - `summary`
   - relation records
6. Implement a pilot ingestion path from markdown + session artifacts into SurrealDB
7. Keep QMD as the text retrieval upgrade path and benchmark against builtin backend
8. Merge text recall and structured recall into one ranked answer assembly step
9. Only after that, consider whether additional graph-specific tooling is needed
