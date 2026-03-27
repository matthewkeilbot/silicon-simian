# 00 — Memory Landscape Review & Critical Design Analysis

## Purpose
Synthesize relevant memory-system patterns from adjacent agent ecosystems and evaluate design choices for an OpenClaw memory architecture that is robust under compaction, token constraints, and long-running usage.

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
- Microsoft GraphRAG + Neo4j GraphRAG ecosystem (knowledge-graph-based retrieval)
- Obsidian-style note graph conventions (link-first, backlink-heavy workflows)

> Note: web search API key was unavailable in this environment, so research used direct source fetches and local OpenClaw docs.

---

## What other systems are optimizing for

## 1) BASB / Obsidian-style systems (human-first PKM)
**Strengths**
- Excellent for human readability and gradual distillation.
- Strong “future discoverability” when notes are linked and summarized.
- Low lock-in (plain markdown).

**Weaknesses for agents**
- Manual upkeep burden.
- Link graphs can become noisy without governance.
- Retrieval quality can degrade if summarization discipline slips.

**Design lesson**
- Keep markdown as source of truth.
- Enforce lightweight, repeatable structure (tags/templates), not heavy ontology upfront.

## 2) QMD / hybrid retrieval systems
**Strengths**
- Strong retrieval quality from keyword + semantic + rerank combination.
- Better robustness on “exact token” queries than vector-only retrieval.
- Local-first privacy posture.

**Weaknesses**
- Operational complexity (models, indexing cadence, warmup, runtime deps).
- Potential cold-start latency and model download overhead.

**Design lesson**
- Use hybrid retrieval where corpus size and query ambiguity justify it.
- Always keep graceful fallback to simpler backend.

## 3) Letta/MemGPT-style memory hierarchies
**Strengths**
- Explicit short-term vs long-term memory semantics.
- Clear mechanisms for promoting/summarizing memory.

**Weaknesses**
- Can become framework-specific and harder to inspect externally.
- Risk of hidden/implicit memory edits without transparent audit trail.

**Design lesson**
- Keep promotion pipeline explicit and auditable.
- Make memory transitions first-class events (who/when/why promoted).

## 4) GraphRAG / Neo4j approaches
**Strengths**
- Powerful for multi-hop reasoning, entity-centric recall, relationship queries.
- Better at “connect-the-dots” questions over sprawling corpora.

**Weaknesses**
- High extraction/governance complexity.
- Graph construction errors can harden into misleading structure.
- Overkill for small/medium personal memory corpora.

**Design lesson**
- Graph is a premium layer, not a day-one dependency.
- Introduce only when relationship-heavy queries become dominant and measurable.

---

## Critical design decisions (and tradeoffs)

## A. Source of truth: Markdown vs database-first
- **Decision:** Keep markdown as canonical source; index/graph are derived caches.
- **Why:** Transparency, portability, debuggability, easy human co-editing.
- **Tradeoff:** More work to maintain derived indexes.

## B. Retrieval quality: vector-only vs hybrid
- **Decision:** Hybrid (BM25 + vector + optional rerank) for medium+ corpora.
- **Why:** Protects exact-match retrieval while preserving semantic recall.
- **Tradeoff:** More compute and tuning complexity.

## C. Memory tiers: 2-layer vs 3+ layers
- **Decision:** 3-layer practical model:
  1. Ephemeral working context (session state)
  2. Durable operational memory (daily + PARA files)
  3. Curated identity/long-term memory (`MEMORY.md`)
- **Why:** Better compaction resilience than 2-layer while staying manageable.

## D. Promotion policy: automatic vs human-confirmed
- **Decision:** Semi-automatic promotion with confidence + contradiction checks.
- **Why:** Full-auto risks memory pollution; full-manual loses consistency.

## E. Graph memory timing
- **Decision:** Delay graph backend until concrete query failures justify it.
- **Why:** Avoid premature complexity; measure first.

---

## Recommended architecture for OpenClaw (short-term + long-term)

## Tier 0 — Working Memory (volatile)
- Current conversation + compacted summaries.
- Never treated as trustworthy long-term truth by itself.

## Tier 1 — Episodic Memory (durable logs)
- `memory/YYYY-MM-DD.md`
- Structured capture bullets (`[decision]`, `[preference]`, `[todo]`, `[insight]`, `[context]`)
- Primary sink for new facts.

## Tier 2 — Semantic/Operational Memory (organized)
- PARA folders under `memory/`:
  - `projects/`, `areas/`, `resources/`, `archive/`
- Weekly distillation from daily notes.

## Tier 3 — Identity & durable facts
- `MEMORY.md`
- Highly curated: identity, stable preferences, long-lived commitments, key decisions.

## Retrieval plane
- Start: OpenClaw builtin memory backend.
- Upgrade path: QMD backend where available.
- Enable recency decay + MMR to reduce stale or duplicate hits.
- Strict scope controls for group vs direct contexts.

---

## Compaction and context-rot mitigation (core problem)

## Problem 1: Compaction memory loss
**Mitigations**
1. Pre-compaction flush (already supported in OpenClaw) with stricter promotion checklist.
2. Add “checkpoint note” at major task boundaries:
   - current goal
   - decisions made
   - next actions
   - blockers
3. On session restart/post-compaction, run targeted rehydration query:
   - project goal
   - last checkpoint
   - active todos

## Problem 2: Context overpopulation / context rot
**Mitigations**
1. Retrieval budget contract:
   - fixed max snippets and chars per turn
   - prefer distilled (L2/L3) notes over raw logs
2. Freshness weighting:
   - favor recent daily notes unless query asks historical/evergreen facts
3. Diversity rerank (MMR):
   - avoid 5 near-duplicate snippets
4. Contradiction-aware selection:
   - if conflicting memories found, inject both with timestamps and ask clarifying question
5. “Need-to-know rehydration”:
   - retrieve only what supports current user intent, not full project dump

---

## Neo4j/Graph layer: where it fits (and where it does not)

## Good fit
- Multi-hop questions: “how does X decision relate to Y project and Z person?”
- Entity/relationship tracking across long timelines.
- Proven need for relationship-centric analytics.

## Poor fit (initially)
- Early-stage memory system still struggling with capture quality.
- Small corpora where hybrid text retrieval already performs well.

## Recommendation
- Keep graph as **Phase 3+ optional accelerator**.
- First implement event/entity extraction from markdown into a lightweight schema.
- Only then evaluate Neo4j as backing store for relationship queries.

---

## Proposed acceptance criteria (robustness)
1. **Recall precision:** top-3 retrieved snippets include at least one directly actionable item for common tasks.
2. **Compaction resilience:** post-compaction restart can recover active project state in <=1 retrieval pass.
3. **Token discipline:** memory injection remains within predefined budget per turn.
4. **Low pollution:** durable memory promotion has low contradiction and duplicate rates.
5. **Privacy safety:** no unintended private-memory leakage in group contexts.

---

## Recommended next implementation steps
1. Establish orchestrator-centric model: BACKLOG.md + STATE.md as first-class files.
2. Add `memory/projects|areas|resources|archive` structure.
3. Create typed bank (`bank/facts.md`, `bank/decisions.md`, `bank/preferences.md`, `bank/lessons.md`) and entity pages (`bank/entities/`).
4. Introduce capture tags in daily memory notes with domain taxonomy metadata.
5. Add weekly distillation routine (L0→L2/L3).
6. Implement checkpoint notes for long tasks.
7. Enable/tune QMD in a pilot env and benchmark against builtin backend.
8. Implement hybrid local index (lexical + semantic with metadata gating).
9. Defer Neo4j until metrics show clear relationship-query gaps.
