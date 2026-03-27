# Memory System Specs (with SurrealDB)

Goal: design a robust, low-friction memory system that keeps current OpenClaw strengths (daily notes + `MEMORY.md`) while adding a **first-class structured memory layer** using SurrealDB. The design still draws from Tiago Forte’s *Building a Second Brain* (CODE + PARA + progressive summarization) and OpenClaw’s existing optional QMD retrieval backend.

## Core stance

- **Markdown remains canonical and human-editable.**
- **QMD remains the preferred hybrid text retrieval path** when available.
- **SurrealDB becomes the structured memory substrate** for temporal assertions, entities, provenance, summaries, and relationship-aware recall.
- Not everything should be graphed. The graph/document layer is for **memory that benefits from structure**, not for turning every sentence into a tiny database tax form.

## What changed in this branch

Compared to the initial draft:

- SurrealDB is no longer treated as a late optional experiment.
- The spec now assumes a derived structured layer with these primary objects:
  - `episode`
  - `entity`
  - `assertion`
  - `summary`
  - relation records for provenance, supersession, contradiction, and relevance
- Retrieval is now modeled as a **two-plane system**:
  1. text recall (Markdown + QMD/builtin memory search)
  2. structured recall (SurrealDB assertions/entities/summaries)

## Operating Assumption: Orchestrator-First Execution

I operate primarily as an **orchestrator**, not a direct executor.

**Role split:**
- **Main agent:** planning, decomposition, delegation, integration, memory maintenance, quality control
- **Sub-agents:** scoped task execution and artifact production

**Design consequence:** the memory system must prioritize:
1. delegated task portfolio state (`BACKLOG.md` + `STATE.md`)
2. orchestration continuity across compaction/session boundaries
3. reliable integration of sub-agent outcomes into both Markdown and structured memory

## Design stance

- Keep the current human-facing two-layer memory model:
  - **Daily notes** for raw event log and short-term context
  - **`MEMORY.md`** for durable, curated long-term memory
- Add a middle and parallel layer so information flows reliably from raw capture to durable structured knowledge.
- Maintain **BACKLOG.md** and **STATE.md** as first-class orchestration files.
- Organize durable human-facing knowledge in a **typed bank** (`bank/`) with entity pages, domain taxonomy, and PARA-compatible routing.
- Mirror high-value memory into SurrealDB as structured records for stronger recall.

## Specs map

0. `00-landscape.md` — ecosystem research + critical design analysis + why SurrealDB belongs
1. `01-background.md` — foundational definitions + retrieval-budget + runtime contract + structured memory lifecycle
2. `01-capture.md` — capture contract and extraction targets
3. `02-organize-para.md` — PARA mapping, typed bank, entity pages, domain taxonomy, file↔structured mapping
4. `03-distill.md` — progressive summarization pipeline and summary/assertion promotion
5. `04-recall-qmd.md` — dual-plane retrieval architecture: text + structured memory
6. `05-governance.md` — retention, privacy, provenance, contradiction, and maintenance
7. `06-roadmap.md` — phased implementation plan with SurrealDB as a first-class workstream

## Simple mental model

Think of the system as four cooperating layers:

1. **Working context** — volatile prompt/session state
2. **Markdown memory** — durable human-readable source of truth
3. **Structured memory** — SurrealDB records for entities/assertions/provenance/summaries
4. **Retrieval plane** — QMD/builtin for text + SurrealDB for temporal/entity/relationship recall

That gives us:
- auditability from files
- richer recall from structure
- lower prompt waste from summaries
- better temporal reasoning than pure snippet search
