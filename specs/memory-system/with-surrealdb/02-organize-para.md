# 02 — PARA Organization, Typed Bank, Entity Pages & Domain Taxonomy (with SurrealDB)

## Objective
Apply PARA without overcomplicating existing OpenClaw memory files, while adding a typed knowledge bank and domain-scalable taxonomy for cross-domain operation.

This version also defines how the **human-readable organization layer** maps into the **structured SurrealDB layer**.

---

## PARA Mapping
- **Projects** → active outcomes with deadlines (`memory/projects/*.md`)
- **Areas** → ongoing responsibilities (`memory/areas/*.md`)
- **Resources** → reference knowledge (`memory/resources/*.md`)
- **Archives** → inactive material (`memory/archive/*.md`)

## Keep existing core
- daily log stays in `memory/YYYY-MM-DD.md`
- `MEMORY.md` remains curated, timeless, and compact

## Operational policy
- new info starts in daily notes
- if still useful after 7+ days, route into PARA file or bank
- if durable across months, summarize into `MEMORY.md`
- if it benefits from structure, reflect it into SurrealDB as entity/assertion/summary state

---

## Domain-Scalable Taxonomy
All memory objects should carry, where applicable:
- `domain`
- `project`
- `entity_type`
- `time_horizon`
- `sensitivity`

### Retrieval routing principle
Route retrieval by **domain first**, then rank within domain by relevance + recency + importance to avoid cross-domain contamination.

### Structured-memory alignment
The same taxonomy should be available in the SurrealDB layer as metadata on:
- episodes
- entities
- assertions
- summaries

That keeps text and structured recall from drifting into separate realities.

---

## Typed Bank + Entity Pages
Durable human-readable knowledge is maintained in `bank/` while keeping markdown as source of truth.

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

---

## File ↔ Structured Mapping

### Daily notes
Primary role:
- canonical episodic log

Structured mirror:
- `episode`
- candidate entity mentions
- candidate assertions

### PARA files
Primary role:
- organized operational/reference knowledge

Structured mirror:
- relevant `summary` records
- stable `assertion` records
- project/entity/topic associations

### Typed bank files
Primary role:
- compact durable human-readable knowledge

Structured mirror:
- assertions
- summaries
- durable entity-level attributes

### Entity pages
Primary role:
- human-readable canonical narrative per entity

Structured mirror:
- `entity` record
- related assertions
- entity summaries
- relationship edges / relation records

### `MEMORY.md`
Primary role:
- curated long-term identity and stable facts

Structured mirror:
- highest-confidence long-lived assertions and summaries

---

## PARA/CODE alignment
| PARA | Memory Mapping |
|------|----------------|
| Projects | active backlog/project entities |
| Areas | long-running domains |
| Resources | references/playbooks/research |
| Archives | completed/superseded memory artifacts |

| CODE | Memory Mapping |
|------|----------------|
| Capture | daily notes / episodes |
| Organize | PARA + bank + entities + structured records |
| Distill | summaries + assertion promotion |
| Express | outputs/decisions/plans informed by recall |

---

## Multi-project knowledge rule
Project-scoped material should stay project-scoped by default.

Cross-project knowledge should be shared by:
- taxonomy (`subject`, `domain`, `project`)
- entity linking
- structured relations or applicability links

This avoids two bad extremes:
- everything isolated forever
- everything globalized into useless mush

---

## Benefits
- keeps action-oriented context separate from evergreen identity/preferences
- reduces bloat in `MEMORY.md`
- improves retrieval targeting with explicit topical files
- domain taxonomy prevents cross-domain contamination
- typed bank provides stable durable knowledge
- SurrealDB structured layer adds stronger temporal/entity/provenance recall without replacing the file system
