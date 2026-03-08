# 01 — Memory Foundations, Retrieval Budget, and Runtime Contract

## Audience
This document is written for both human reviewers and agent implementers (🤖).

## Why this exists
A memory system for agents has to solve a paradox:
- remember enough to stay coherent over long timelines,
- but inject little enough context to stay fast, cheap, and accurate.

This document defines the conceptual model and design constraints to resolve that paradox.

---

## 1) Three tiers of memory (definitions + practical use)

## Tier 1 — Working Memory (volatile, in-session)
**Definition**
- The currently active prompt/context window and short rolling summaries.
- Equivalent to human working memory: limited, task-focused, rapidly replaced.

**When relevant**
- During active conversations and immediate multi-step tasks.
- For temporary details that may not deserve durable storage.

**Examples**
- “Current task: draft the API migration checklist.”
- “User asked for 3 options and a recommendation.”
- “Need to confirm prod hostname before running deployment command.”

**Failure mode**
- Lost at compaction or session reset unless checkpointed.

---

## Tier 2 — Episodic/Operational Memory (durable, time-indexed)
**Definition**
- Day-level logs and operational notes, generally in `memory/YYYY-MM-DD.md` plus organized PARA files.
- Equivalent to human episodic memory (what happened, when, in what context).

**When relevant**
- Reconstructing sequence and rationale of recent work.
- Recovering post-compaction state.
- Mining for patterns and recurring issues.

**Examples**
- “2026-03-03: decided to pilot QMD in one environment before broad rollout.”
- “Captured blocker: Brave web search unavailable due to missing API key.”
- “Moved memory architecture draft into specs/memory-system/…”

**Failure mode**
- Can become noisy and repetitive without distillation/pruning.

---

## Tier 3 — Semantic/Identity Memory (curated, long-horizon)
**Definition**
- Durable truths and stable preferences (e.g., `MEMORY.md`), plus high-value synthesized summaries.
- Equivalent to human semantic memory (facts, concepts, enduring preferences).

**When relevant**
- Personalization, consistent behavior, and long-term continuity.
- Decision carry-over across weeks/months.

**Examples**
- “User prefers Neo4j as a future graph-memory direction.”
- “Default architecture principle: markdown is source-of-truth; indexes are derived.”
- “Safety preference: ask before external/public actions.”

**Failure mode**
- Memory pollution if promotions are too permissive.

---

## Tier interactions (important)
- New information should **enter via Tier 2** (episodic) unless already clearly durable.
- Tier 3 should be populated by promotion rules, not by raw chat echo.
- Tier 1 should be periodically checkpointed into Tier 2 to survive compaction.

---

## 2) Retrieval-budget problem (detailed)

## Core idea
“Context rot” is mostly a **retrieval-budget allocation** issue, not just a retrieval-quality issue.

Even perfect retrieval can fail if too much text is injected. Model attention degrades with overlong context, and token cost climbs.

## Budget dimensions
1. **Token budget**: max memory tokens per turn.
2. **Snippet budget**: max number of snippets injected.
3. **Diversity budget**: avoid near-duplicate snippets.
4. **Freshness budget**: favor recency unless explicitly historical query.
5. **Certainty budget**: include confidence/age when facts may conflict.

## Symptoms of budget failure
- Relevant fact buried under low-signal text.
- Contradictory snippets without timestamps/confidence.
- High latency/cost with lower answer quality.
- “Parroted history” instead of intent-focused reasoning.

## Practical controls
- Hard cap snippets and chars per retrieval.
- Prefer distilled summaries (L2/L3) over raw logs when available.
- Use MMR/diversity reranking to avoid repeated context.
- Apply temporal decay for dated logs.
- Reserve a fraction of context for *new user intent* (never give memory 100% of budget).

## Recommendation (initial)
- memory injection target: ~10–20% of available prompt tokens.
- keep top-3 to top-6 snippets unless user requests deep dive.
- if confidence is low or contradictions exist, ask a clarification question instead of over-injecting.

---

## 3) Memory Runtime Contract (background perspective)

A runtime contract is the set of invariants every memory write/read path must obey.

## Contract principles
1. **Canonicality**: Markdown files are source-of-truth.
2. **Derivation**: indexes/vector stores/graphs are rebuildable derivatives.
3. **Budgeted retrieval**: retrieval must respect token and snippet ceilings.
4. **Promotion discipline**: durable memory writes require quality gates.
5. **Scope safety**: memory visibility must follow chat context boundaries.
6. **Auditability**: important promotions should be explainable (why/when/source).

## Contract events
- **Capture event**: write high-signal operational facts to daily note.
- **Checkpoint event**: at task boundaries, summarize current state for compaction resilience.
- **Distill event**: compress episodic logs into concise summaries.
- **Promote event**: move durable truths into long-term memory with confidence.
- **Supersede event**: mark older facts replaced by newer evidence.
- **Prune event**: archive/remove low-value or stale operational noise.

## Why this helps
- prevents silent memory drift,
- lowers long-term maintenance cost,
- gives predictable behavior for both humans and agents.

---

## 4) Pruning, supersession, and evolution over time

## Pruning
Pruning is not deletion-only; it is information lifecycle management.

### Candidate pruning rules
- stale todos with no activity beyond threshold,
- duplicate insights across multiple daily logs,
- low-confidence facts never reconfirmed,
- obsolete project notes moved to archive.

## Supersession
New revelations should not blindly overwrite history.

### Supersession pattern
- retain original fact with timestamp,
- add replacement fact with newer timestamp + source,
- mark older as superseded,
- retrieval should prefer newest high-confidence fact but expose history when relevant.

This mirrors human cognition: we revise beliefs rather than pretending old beliefs never existed.

## Evolution
As corpus grows:
1. more distillation needed,
2. stronger retrieval ranking needed,
3. optional graph/entity layer becomes useful for relationship-heavy reasoning.

System should evolve by measured pain points, not by speculative complexity.

---

## 5) Human cognition parallels (for reviewers)

This architecture maps to known cognitive distinctions:
- **Working memory**: limited-capacity active workspace.
- **Episodic memory**: time/context-bound experiences.
- **Semantic memory**: abstracted long-term knowledge.

Key design implication:
- Humans do not replay all episodic memories to act; they retrieve selectively, with gist-first access.
- Agent memory should do the same: store rich history, retrieve sparse relevance.

Another useful parallel:
- Human memory is reconstructive and error-prone.
- Agent memory needs explicit contradiction handling, timestamps, and confidence to avoid false certainty.

---

## 6) Vector databases in the big picture

## What they are
Vector databases/indexes store embeddings for fast semantic similarity search, often with metadata filtering and scalable CRUD.

## Where they fit
- Retrieval acceleration layer for semantic recall.
- Not a replacement for source documents.
- Best used with hybrid retrieval (keyword + vector + rerank).

## Alignment with our goals
- Helps recall semantically similar concepts even when wording differs.
- Supports larger corpora where plain scan is insufficient.
- Works well as derived infrastructure behind markdown memory.

## Cautions
- Embedding drift (model changes) can alter retrieval behavior.
- Pure vector search can miss exact tokens/IDs.
- Needs governance for reindex cadence, cost, and observability.

## Practical stance
- Keep vector store as a derived index; rebuildable from markdown.
- Use hybrid retrieval to cover both exact and semantic queries.
- Add graph/Neo4j later if relationship reasoning needs exceed hybrid text retrieval.

---

## 7) Orchestrator-Centric Operating Model

### Operating Assumption: Sub-Agent-First Execution

The main agent operates primarily as an **orchestrator**, not a direct executor.

**Role split:**
- **Main agent:** planning, decomposition, delegation, integration, memory maintenance, quality control.
- **Sub-agents:** scoped task execution and artifact production.

**Design consequence:** The memory system must prioritize:
1. Delegated task portfolio state
2. Orchestration continuity across compaction/session boundaries
3. Reliable integration of sub-agent outcomes into durable memory

### BACKLOG.md vs STATE.md Contract

Both files are maintained with strict boundaries to minimize complexity.

#### BACKLOG.md (stable control plane)

**Purpose:** what work exists and its lifecycle.

**Must contain:**
- task id/title
- priority
- status (`todo` | `in-progress` | `blocked` | `done`)
- assignee (`main` | `subagent:<id>`)
- source (who/where/when)
- acceptance criteria
- optional topic/thread linkage

**Must not contain:**
- volatile step-by-step execution notes
- long command logs
- transient in-flight details

#### STATE.md (volatile orchestrator cockpit)

**Purpose:** what the orchestrator is actively doing right now to manage execution.

**Must contain:**
- active focus (current orchestration objective)
- current delegation actions (spawning, waiting, integrating)
- in-flight sub-agent runs + expected next signal
- current blockers + unblock conditions
- next 1–3 orchestrator actions

**Must not contain:**
- full backlog/task inventory
- long-term lessons/preferences
- historical archive content

#### Sync Rules

1. No task execution/delegation starts before a backlog entry exists.
2. When a backlog item enters `in-progress`, STATE.md is updated in the same work cycle.
3. On significant transition (spawned, blocked, integrated, completed), backlog + state are updated together.
4. If blocked >15 min, backlog reflects external status; state reflects immediate recovery plan.
5. When item reaches `done`, backlog closes it; state rolls to next orchestration focus.

---

## 8) Implementation implications for current specs
- Keep 3-tier memory model explicit across all specs.
- Add retrieval-budget policy to runtime contract.
- Add supersession metadata conventions.
- Add monthly pruning/distillation maintenance checklist.
- Maintain BACKLOG.md and STATE.md as first-class orchestration files.
- Add measurable quality metrics:
  - precision@k for memory recall,
  - compaction recovery success rate,
  - average memory tokens injected per turn,
  - contradiction incidence over time.
