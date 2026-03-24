# Agent Team Architecture

## Overview

MEK's agent organization. MEK is the CEO and primary orchestrator. Matthew (the Director) sets strategy and approves key decisions. This directory contains all specifications, agent definitions, and process documentation for building and maintaining a high-functioning AI team.

## Directory Structure

```
specs/agent-team/
├── README.md                     # This file
├── architecture.md               # Overall team architecture & design decisions
├── agents/                       # Agent specification docs (reference/planning)
│   ├── CTO.md                    # Chief Technology Officer spec
│   ├── PA.md                     # Personal Assistant spec
│   └── MECHANIC.md               # System Mechanic spec
├── processes/
│   ├── documentation-process.md  # How we instrument and document effectiveness
│   └── improvement-process.md    # How we iterate and improve over time
└── research/
    └── skill-catalog.md          # Research findings from repo analysis

## Live Agent Directories (canonical, runtime)

agents/                           # Top-level workspace directory
├── README.md                     # Convention docs
├── .gitignore                    # Ignores */workspace/
├── cto/
│   ├── PERSONA.md                # Canonical prompt (git-tracked)
│   ├── memory/                   # Continuity files (git-tracked)
│   └── workspace/                # Runtime scratch (gitignored)
├── mechanic/
│   └── ...
└── pa/
    └── ...
```

**Note:** Agent specs in `specs/agent-team/agents/` are planning/reference docs. The canonical runtime personas live at `agents/<agent>/PERSONA.md` — that's what gets passed verbatim to the agent at spawn time.

## Status

- [ ] Architecture spec
- [ ] Agent definitions (CTO, PA, Mechanic)
- [ ] Process documentation
- [ ] Skill catalog research
- [ ] Codex 5.4 review
- [ ] Gemini 3.1 Pro review
- [ ] Implementation
