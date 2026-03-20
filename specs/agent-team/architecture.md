# Agent Team Architecture

## Design Principles

1. **Self-sufficiency** — Every agent researches before asking. No laziness, no delegation of lookups up the chain.
2. **Layered delegation** — CEO → C-level (persistent) → task agents (one-shot). Each level manages its own sub-agents.
3. **Minimal context, maximum impact** — Agent markdown files are lean and actionable. No bloat.
4. **Iterative improvement** — Every agent is measured, reviewed, and improved continuously.
5. **Safe by default** — External artifacts go through quarantine. Destructive operations require approval gates.

## Team Structure

```
CEO (MEK - main agent)
├── CTO (persistent session)
│   ├── Frontend Dev (one-shot, per task)
│   ├── Backend Dev (one-shot, per task)
│   ├── Code Reviewer (one-shot, per task)
│   ├── Infra/DevOps (one-shot, per task)
│   └── Architect (one-shot, per task)
├── PA (persistent session)
│   ├── Web Researcher (one-shot, per task)
│   ├── Data Manager (one-shot, per task)
│   └── Comms Handler (one-shot, per task)
└── Mechanic (persistent session)
    ├── Debugger (one-shot, per task)
    ├── Patcher (one-shot, per task)
    └── Sys Admin (one-shot, per task)
```

## Implementation Approach

### Option A: Sub-agent sessions (current focus)

Use `sessions_spawn` with `mode="session"` for C-levels and `mode="run"` for task agents. This keeps everything within the main agent's session tree.

**Pros:** Simple, no config changes, works within existing auth.
**Cons:** Depends on gateway sub-agent spawning (currently broken — pairing bug).

### Option B: Multi-agent routing (future)

Use OpenClaw's native multi-agent routing (`agents.list` + `bindings`) to create fully isolated agents with their own workspaces, auth, and session stores.

**Pros:** True isolation, per-agent skills, independent operation.
**Cons:** Requires config changes, separate bot accounts per channel agent, more complex setup.

### Recommended Path

Start with **Option A** (sub-agent sessions) once the gateway pairing bug is fixed. Design everything to be forward-compatible with Option B so we can migrate C-levels to fully isolated agents later.

For now, C-level agents will be spawned as persistent sessions from the CEO with rich agent markdown context. Their task agents will be one-shot spawns from the C-level session.

## Model Assignment

| Role | Model | Rationale |
|------|-------|-----------|
| CEO (MEK) | anthropic/claude-opus-4-6 | Strategic thinking, orchestration, personality |
| CTO | anthropic/claude-opus-4-6 | Architecture decisions, complex reasoning |
| PA | openai-codex/gpt-5.4 | Efficient for routine tasks, cost-effective |
| Mechanic | anthropic/claude-opus-4-6 | Deep debugging, system understanding |
| Frontend Dev | openai-codex/gpt-5.4 | Code generation, fast iteration |
| Backend Dev | openai-codex/gpt-5.4 | Code generation |
| Code Reviewer | google-gemini-cli/gemini-3.1-pro-preview | Fresh perspective, model diversity |
| Infra/DevOps | openai-codex/gpt-5.4 | Infrastructure code |
| Debugger | anthropic/claude-opus-4-6 | Root cause analysis needs deep reasoning |
| Patcher | openai-codex/gpt-5.3-codex | Straightforward code fixes |
| Web Researcher | openai-codex/gpt-5.4 | Efficient search and synthesis |

## Skill Distribution

### CTO Skills (workspace: per-agent or shared)
- **superpowers/subagent-driven-development** — Core orchestration pattern
- **superpowers/writing-plans** — Implementation planning
- **superpowers/brainstorming** — Design before implementation
- **superpowers/requesting-code-review** — Dispatch code reviews
- **superpowers/dispatching-parallel-agents** — Parallel task execution
- **superpowers/executing-plans** — Plan execution framework
- **superpowers/finishing-a-development-branch** — Branch completion workflow
- **superpowers/using-git-worktrees** — Workspace isolation
- **anthropic/frontend-design** — Frontend UI creation
- **anthropic/webapp-testing** — Testing with Playwright
- **anthropic/mcp-builder** — MCP server development
- **Custom: tech-lead** — CTO-specific orchestration, team management

### PA Skills
- **anthropic/doc-coauthoring** — Documentation assistance
- **anthropic/xlsx** — Spreadsheet management
- **anthropic/pdf** — PDF processing
- **anthropic/docx** — Word document creation
- **anthropic/pptx** — Presentation creation
- **Custom: email-calendar** — Email triage, calendar management (adapted from community)
- **Custom: web-research** — Deep web research workflow
- **Custom: task-tracker** — Task/project tracking

### Mechanic Skills
- **superpowers/systematic-debugging** — Root cause analysis methodology
- **superpowers/verification-before-completion** — Evidence before claims
- **superpowers/test-driven-development** — TDD for fixes
- **superpowers/receiving-code-review** — Handle review feedback
- **Custom: openclaw-internals** — OpenClaw source navigation, config, debugging
- **Custom: linux-admin** — System administration, service management
- **Custom: git-operations** — Cherry-pick, rebase, branch management

### Shared Skills (all agents)
- **safe-download-and-read** — Quarantine-based artifact inspection
- **skill-development** — Creating/improving skills (adapted from anthropic/skill-creator)

## Communication Protocol

### CEO → C-level
- Use `sessions_send` to persistent sessions
- Include task context, expected deliverables, and deadline
- C-levels report back with structured updates

### C-level → Task Agents
- Use `sessions_spawn` with `mode="run"` 
- Include full task specification in the spawn task
- Task agent does work and returns result
- C-level reviews result before reporting up

### Status Updates
- C-levels maintain a status file in their workspace: `status.md`
- CEO checks status during heartbeats or on-demand
- Format: `## Current Tasks`, `## Completed`, `## Blocked`

## Security Model

### Approval Gates (Phase 1)
- All destructive host operations require CEO approval
- External communications (email, social) require CEO approval  
- Package installations require CEO approval
- Git push operations require CEO approval

### Elevated Access (Future, per Matthew's approval)
- Mechanic: host-level access for system repairs
- CTO: deployment permissions
- PA: email send permissions

### Data Boundaries
- C-levels do NOT have access to MEMORY.md or personal context
- C-levels share the main workspace but operate in designated subdirectories
- Task agents get only the context they need (principle of least privilege)
