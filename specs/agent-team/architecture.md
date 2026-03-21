# Agent Team Architecture

## Design Principles

1. **Self-sufficiency** — Every agent researches before asking. No laziness, no delegation of lookups up the chain.
2. **Layered delegation** — CEO → C-level (persistent) → task agents (one-shot). Each level manages its own sub-agents.
3. **Minimal context, maximum impact** — Agent markdown files are lean and actionable. No bloat.
4. **Iterative improvement** — Every agent is measured, reviewed, and improved continuously.
5. **Safe by default** — External artifacts go through quarantine. Destructive operations require approval gates.

## Team Structure

```
Director (Matthew — human, sets strategy, approves key decisions)
└── CEO (MEK — OpenClaw main agent, orchestrator)
    ├── CTO — OpenClaw sub-agent (persistent)
    │   ├── Frontend Dev — ACP (codex-5.4)
    │   ├── Backend Dev — ACP (codex-5.4)
    │   ├── Code Reviewer — ACP (gemini-3-pro)
    │   ├── Infra/DevOps — ACP (codex-5.4)
    │   └── Architect — ACP (opus)
    ├── PA — OpenClaw sub-agent (persistent)
    │   ├── Web Researcher — ACP (codex-5.4)
    │   ├── Data Manager — ACP (codex-5.3)
    │   └── Comms Handler — ACP (codex-5.4)
    └── Mechanic — OpenClaw sub-agent (persistent)
        ├── Debugger — ACP (opus)
        ├── Patcher — ACP (codex-5.3)
        └── Sys Admin — ACP (codex-5.4)
```

### Runtime Layers

- **Director (Matthew):** Human. Strategy, approvals, final authority.
- **CEO (MEK):** OpenClaw main agent. Orchestrates C-levels, owns communication channels, routes skills and references to sub-agents.
- **C-level agents:** OpenClaw sub-agents (`runtime="subagent"`, `mode="session"`). Full tool access — `exec`, `web_fetch`, `browser`, `sessions_spawn`, `message`. Can do their own web research, spawn ACP workers with model selection, and communicate back to channels.
- **Task agents:** ACP sessions (`runtime="acp"`, `mode="run"`). Pure model workers with native filesystem and terminal access. Spawned by C-levels for specific tasks. Disposable — they get injected with model skills + references and return results.

## Implementation Approach

### Phase 1: Sub-agent sessions (current focus)

- C-levels: `sessions_spawn` with `runtime="subagent"`, `mode="session"` — persistent OpenClaw sub-agents with full tool access
- Task agents: C-levels use `sessions_spawn` with `runtime="acp"`, `mode="run"` — one-shot model workers with filesystem/terminal access
- CEO injects model skills + references into C-level agent context at spawn time
- C-levels inject relevant model skills + references into ACP task prompts

### Phase 2: Multi-agent routing (future)

Use OpenClaw's native multi-agent routing (`agents.list` + `bindings`) to give C-levels fully isolated agents with their own workspaces, auth, and session stores.

**Pros:** True isolation, per-agent skills, independent operation.
**Cons:** Requires config changes, separate bot accounts per channel agent, more complex setup.

### Design Principle

Everything in Phase 1 is forward-compatible with Phase 2. C-level agent definitions are self-contained so they can be extracted into independent agents later.

## Model Assignment

| Role | Runtime | Model | Rationale |
|------|---------|-------|-----------|
| Director (Matthew) | Human | — | Strategy, approvals, final authority |
| CEO (MEK) | OpenClaw main | anthropic/claude-opus-4-6 | Orchestration, communication, personality |
| CTO | OpenClaw sub-agent | anthropic/claude-opus-4-6 | Architecture decisions, complex reasoning |
| PA | OpenClaw sub-agent | openai-codex/gpt-5.4 | Efficient for routine tasks, cost-effective |
| Mechanic | OpenClaw sub-agent | anthropic/claude-opus-4-6 | Deep debugging, system understanding |
| Frontend Dev | ACP | openai-codex/gpt-5.4 | Code generation, fast iteration |
| Backend Dev | ACP | openai-codex/gpt-5.4 | Code generation |
| Code Reviewer | ACP | google-gemini-cli/gemini-3-pro-preview | Fresh perspective, model diversity |
| Infra/DevOps | ACP | openai-codex/gpt-5.4 | Infrastructure code |
| Debugger | ACP | anthropic/claude-opus-4-6 | Root cause analysis needs deep reasoning |
| Patcher | ACP | openai-codex/gpt-5.3-codex | Straightforward code fixes |
| Web Researcher | ACP | openai-codex/gpt-5.4 | Efficient search and synthesis |

## Skill Distribution

Skills are split into three layers:

- **OpenClaw skills** (`skills/openclaw/`) — Used by the CEO and C-level OpenClaw sub-agents directly. Reference OpenClaw tools (`exec`, `browser`, `message`, `web_fetch`, `sessions_spawn`, etc.).
- **Model skills** (`skills/model/`) — Injected into ACP task agents at spawn time. Pure coding/filesystem instructions. No OpenClaw tool references.
- **References** (`skills/references/`) — Shared knowledge (codebase maps, conventions, checklists). Either layer can pull from these.

### CEO Skills (OpenClaw)
- All existing workspace skills (web-discovery, asset-pipeline, audio-transcription, etc.)
- Orchestration: spawning C-levels, routing tasks, channel communication
- Skill routing: assembles the right model skills + references for each spawn

### CTO Skills
**OpenClaw (direct use):**
- `openclaw/subagent-driven-development` — Core orchestration pattern
- `openclaw/requesting-code-review` — Dispatch code reviews
- `openclaw/dispatching-parallel-agents` — Parallel task execution
- `openclaw/tech-lead` — CTO-specific orchestration, team management (custom, to build)

**Model (injected into ACP task agents):**
- `model/writing-plans` — Implementation planning
- `model/brainstorming` — Design before implementation
- `model/executing-plans` — Plan execution framework
- `model/finishing-a-development-branch` — Branch completion workflow
- `model/using-git-worktrees` — Workspace isolation
- `model/frontend-design` — Frontend UI creation
- `model/webapp-testing` — Testing with Playwright
- `model/mcp-builder` — MCP server development
- `model/tdd-workflow` — TDD methodology
- `model/verification-before-completion` — Evidence before claims

### PA Skills
**OpenClaw (direct use):**
- `openclaw/email-calendar` — Email triage + calendar management (custom, to build)
- `openclaw/web-research` — Deep web research workflow (custom, to build)
- `openclaw/task-tracker` — Task/project tracking (custom, to build)

**Model (injected into ACP task agents):**
- `model/doc-coauthoring` — Documentation assistance
- `model/xlsx` — Spreadsheet management
- `model/pdf` — PDF processing
- `model/docx` — Word document creation
- `model/pptx` — Presentation creation

### Mechanic Skills
**OpenClaw (direct use):**
- `openclaw/systematic-debugging` — Root cause analysis methodology
- `openclaw/openclaw-internals` — OpenClaw source navigation, config, debugging (custom, to build)
- `openclaw/linux-admin` — System administration, service management (custom, to build)

**Model (injected into ACP task agents):**
- `model/tdd-workflow` — TDD for fixes
- `model/verification-before-completion` — Evidence before claims
- `model/receiving-code-review` — Handle review feedback
- `model/git-operations` — Cherry-pick, rebase, branch management (custom, to build)

### References (shared, all layers)
- `references/openclaw-codebase.md` — Key file locations, architecture, common patterns
- `references/project-conventions.md` — Code style, commit messages, PR process
- `references/debugging-checklist.md` — Systematic debugging steps

### Shared Skills (all C-levels, OpenClaw layer)
- **safe-download-and-read** — Quarantine-based artifact inspection
- **skill-development** — Creating/improving skills

## Communication Protocol

### Director → CEO
- Direct chat (Telegram MEK group, gateway terminal)
- Strategic direction, approvals, feedback
- CEO executes autonomously within approved scope

### CEO → C-level
- Use `sessions_send` to persistent OpenClaw sub-agent sessions
- Include task context, expected deliverables, and priority
- Inject relevant OpenClaw skills at session creation
- C-levels report back with structured updates

### C-level → Task Agents
- Use `sessions_spawn` with `runtime="acp"`, `mode="run"`
- Inject relevant model skills + references into the task prompt
- Select model based on task requirements (opus for reasoning, codex for code, gemini for review)
- Task agent does work and returns result
- C-level reviews result before reporting up

### Status Updates
- C-levels maintain a status file in their workspace: `status.md`
- CEO checks status during heartbeats or on-demand
- Format: `## Current Tasks`, `## Completed`, `## Blocked`

## Security Model

### Approval Gates (Phase 1)
- All destructive host operations require Director approval
- External communications (email, social) require Director approval  
- Package installations require CEO or Director approval
- Git push operations require CEO or Director approval

### Elevated Access (Future, per Matthew's approval)
- Mechanic: host-level access for system repairs
- CTO: deployment permissions
- PA: email send permissions

### Data Boundaries
- C-levels do NOT have access to MEMORY.md or personal context
- C-levels share the main workspace but operate in designated subdirectories
- Task agents get only the context they need (principle of least privilege)
