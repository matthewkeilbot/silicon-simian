# 06 — Implementation Roadmap

## Phase 0 (now)
- Create specs structure.
- Keep daily notes + `MEMORY.md` intact.
- Document current behavior and gaps.

## Phase 1 (foundation)
- Introduce capture tags in daily notes.
- Add weekly distillation workflow.
- Start minimal PARA folders under `memory/`.
- Create `BACKLOG.md` and `STATE.md` with orchestrator contract.
- Create `bank/` directory with typed files (facts, decisions, preferences, lessons).
- Create `bank/entities/` structure (people, projects, orgs, tools, topics).

## Phase 2 (retrieval upgrade)
- Pilot QMD backend in a controlled environment.
- Tune limits/scope/citations.
- Benchmark against builtin recall quality.

## Phase 3 (governance)
- Add contradiction checks and dedupe automation.
- Add monthly memory review checklist.
- Define migration conventions for outdated facts.

## Phase 4 (agentic expression)
- Link memory outputs to concrete project execution.
- Track which recalled notes actually helped complete tasks.
- Close the CODE loop by measuring “Express” outcomes.

## Open questions
- Should PARA live purely in files or also in metadata index?
- What should be auto-promoted vs require explicit user confirmation?
- How aggressively should group-derived facts be stored?
- Domain taxonomy: enforce via frontmatter YAML, inline tags, or both?
- BACKLOG.md format: flat list vs grouped by domain/project?
- Entity page creation threshold: when does a person/tool/project earn its own page?
