# Memory System Specs (vNext)

Goal: design a robust, low-friction memory system that keeps current OpenClaw strengths (daily notes + `MEMORY.md`) and expands them using principles from Tiago Forte’s *Building a Second Brain* (CODE + PARA + progressive summarization), plus OpenClaw’s optional QMD retrieval backend.

## What I learned (research summary)

### From Building a Second Brain (Forte)
- **CODE loop**: Capture → Organize → Distill → Express.
- **PARA structure**: Projects, Areas, Resources, Archives for action-oriented organization.
- **Progressive summarization**: Make notes easier for Future You to scan by layering summaries over time (highlights, bolding, executive summary).
- Core principle: store selectively, organize by actionability, and convert knowledge into output.

### From OpenClaw docs
- Current memory source of truth is Markdown files (`memory/YYYY-MM-DD.md`, optional `MEMORY.md`).
- `memory_search` and `memory_get` are first-class tools.
- **QMD backend exists already** (experimental): `memory.backend = "qmd"` with local-first hybrid retrieval (BM25 + vectors + reranking) and periodic index updates.

## Operating Assumption: Orchestrator-First Execution

I operate primarily as an **orchestrator**, not a direct executor.

**Role split:**
- **Main agent (me):** planning, decomposition, delegation, integration, memory maintenance, quality control.
- **Sub-agents:** scoped task execution and artifact production.

**Design consequence:** My memory system must prioritize:
1. Delegated task portfolio state (BACKLOG.md + STATE.md)
2. Orchestration continuity across compaction/session boundaries
3. Reliable integration of sub-agent outcomes into durable memory

## Design stance
- Keep current two-layer memory model:
  - **Daily notes** for raw event log and short-term context.
  - **`MEMORY.md`** for durable, curated long-term memory.
- Add a middle layer and better pipelines so information flows reliably from raw capture to durable knowledge.
- Maintain **BACKLOG.md** (stable task portfolio) and **STATE.md** (volatile orchestrator cockpit) as first-class orchestration files.
- Organize durable knowledge in a **typed bank** (`bank/`) with entity pages, tagged with a domain-scalable taxonomy.

## Specs map
0. `00-landscape/` — ecosystem research + critical design analysis
1. `01-background/` — foundational definitions + retrieval-budget + runtime contract + orchestrator model
2. `01-capture/` — capture contract and ingestion rules
3. `02-organize-para/` — PARA mapping, typed bank, entity pages, domain taxonomy
4. `03-distill/` — progressive summarization pipeline
5. `04-recall-qmd/` — retrieval architecture, hybrid index (exact + semantic), QMD strategy
6. `05-governance/` — retention, privacy, quality checks
7. `06-roadmap/` — phased implementation plan
