# 02 — PARA Organization, Typed Bank, Entity Pages & Domain Taxonomy

## Objective
Apply PARA without overcomplicating existing OpenClaw memory files, while adding a typed knowledge bank and domain-scalable taxonomy for cross-domain operation.

## PARA Mapping
- **Projects** → active outcomes with deadlines (can live in `memory/projects/*.md`)
- **Areas** → ongoing responsibilities (`memory/areas/*.md`)
- **Resources** → reference knowledge (`memory/resources/*.md`)
- **Archives** → inactive material (`memory/archive/*.md`)

## Keep existing core
- Daily log stays in `memory/YYYY-MM-DD.md`.
- `MEMORY.md` remains curated, timeless, and compact.

## Operational policy
- New info starts in daily notes.
- If still useful after 7+ days, route into PARA file.
- If durable across months, summarize into `MEMORY.md`.

---

## Domain-Scalable Taxonomy (Worldly Scope)

Because the agent operates across broad domains (not a single project), all memory objects must be tagged with:

- **domain** (`work`, `personal`, `operations`, `learning`, `admin`, `social`, `health`, etc.)
- **project** (nullable, multi-project capable)
- **entity_type** (`person`, `org`, `place`, `tool`, `asset`, `topic`, `event`)
- **time_horizon** (`now`, `this_week`, `later`, `archived`)
- **sensitivity** (`public`, `private`, `restricted`)

### Retrieval routing principle
Route retrieval by **domain first**, then rank within domain by relevance + recency + importance to avoid cross-domain contamination.

---

## Typed Bank + Entity Pages (PARA/CODE Compatible)

Durable knowledge is maintained in `bank/` while keeping markdown as source of truth.

### Typed bank files
- `bank/facts.md`
- `bank/decisions.md`
- `bank/preferences.md`
- `bank/lessons.md`

### Entity pages
- `bank/entities/people/*.md`
- `bank/entities/projects/*.md`
- `bank/entities/orgs/*.md`
- `bank/entities/tools/*.md`
- `bank/entities/topics/*.md`

### PARA/CODE alignment
| PARA | Memory Mapping |
|------|----------------|
| Projects | active backlog/project entities |
| Areas | long-running domains |
| Resources | references/playbooks/research |
| Archives | completed/superseded memory artifacts |

| CODE | Memory Mapping |
|------|----------------|
| Capture | task/state/events (daily notes) |
| Organize | typed bank + entities |
| Distill | consolidation (progressive summarization) |
| Express | outputs/decisions/plans |

---

## Benefits
- Keeps action-oriented context separate from evergreen identity/preferences.
- Reduces bloat in `MEMORY.md`.
- Improves retrieval targeting with explicit topical files.
- Domain taxonomy prevents cross-domain contamination in retrieval.
- Typed bank provides structured, queryable durable knowledge.
