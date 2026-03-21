# Agent Team Architecture

## Design Principles

1. **Self-sufficiency** — Every agent researches before asking. No laziness, no delegation of lookups up the chain.
2. **Layered delegation** — CEO → C-level (persistent) → task agents (one-shot). Each level manages its own sub-agents.
3. **Minimal context, maximum impact** — Agent markdown files are lean and actionable. No bloat, but full-featured enough to achieve the goals.
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

Use OpenClaw's native multi-agent routing (`agents.list` + `bindings`) to give C-levels fully isolated agents with their own session stores and dedicated workspaces under `agent-workspaces/`. Auth is shared from the CEO — no separate bot accounts needed.

**Pros:** True isolation, per-agent skills, independent operation, dedicated session stores.
**Cons:** Requires config changes, more complex setup.

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

Skills are listed by **capability** (what the agent needs to be able to do), not by specific tool/repo names. Specific implementations will be researched and built/sourced as needed.

### CEO Skills (OpenClaw)
- **Team orchestration** — Spawning C-levels, routing tasks, composing skill+reference bundles for spawns
- **Channel communication** — Messaging across Telegram, Discord, and other surfaces
- **Web research** — Browser-driven discovery and URL content extraction
- **Asset creation** — Image/audio/video generation and delivery
- **Scheduling & cron** — Recurring tasks, reminders, heartbeat management
- **Security gatekeeping** — Quarantine inspection, approval workflows, external artifact safety

### CTO Skills
**OpenClaw (direct use):**
- **Sub-agent orchestration** — Spawning, tracking, and reviewing work from ACP task agents
- **Code review dispatch** — Sending code to reviewers, collecting and synthesizing feedback
- **Parallel task management** — Running multiple task agents concurrently on independent work
- **Web research** — Investigating libraries, APIs, docs, RFCs, and technical approaches
- **Technical decision-making** — Evaluating tradeoffs, recording architecture decisions

**Model (injected into ACP task agents):**
- **Implementation planning** — Breaking requirements into ordered, testable steps
- **Brainstorming & design** — Exploring approaches before committing to code
- **Plan execution** — Following a plan step-by-step with verification at each stage
- **Branch management** — Starting, finishing, and cleaning up feature branches
- **Git worktrees** — Isolated workspaces for parallel branch work
- **Frontend development** — UI/UX implementation (React, Next.js, CSS, accessibility)
- **Backend development** — API design, server logic, database interactions
- **Testing** — TDD workflow, integration tests, E2E with Playwright
- **Code review handling** — Receiving and responding to review feedback thoughtfully
- **Verification** — Proving work is complete with evidence before claiming done
- **CI/CD & DevOps** — Docker, pipelines, deployment configs, infrastructure as code

### PA Skills
**OpenClaw (direct use):**
- **Email management** — Inbox triage, drafting responses, flagging urgent items
- **Calendar management** — Scheduling, conflict detection, reminders
- **Web research** — Deep research with source-linked reports
- **Task tracking** — Maintaining task lists, deadlines, status reporting
- **Daily briefings** — Compiling morning summaries (email + calendar + weather + relevant updates)

**Model (injected into ACP task agents):**
- **Document creation** — Spreadsheets, presentations, PDFs, Word docs
- **Data organization** — Structuring, cleaning, and transforming data
- **Writing & editing** — Drafting content, proofreading, formatting
- **Report generation** — Compiling research findings into structured deliverables

### Mechanic Skills
**OpenClaw (direct use):**
- **Systematic debugging** — Root cause analysis before any fixes, evidence-based diagnosis
- **OpenClaw internals** — Source navigation, config debugging, gateway lifecycle, plugin architecture
- **Linux system administration** — Service management, log analysis, resource monitoring, networking
- **Web research** — Searching for error messages, checking upstream issues, reading docs
- **Sub-agent orchestration** — Spawning debuggers, patchers, and sys admin workers

**Model (injected into ACP task agents):**
- **Test-driven development** — Write test, watch fail, write minimal fix, verify
- **Verification** — Evidence that the fix works before claiming completion
- **Code review handling** — Receiving and responding to review feedback on patches
- **Git operations** — Cherry-picking, rebasing, conflict resolution, worktree management
- **Brainstorming & design** — Exploring approaches before committing to a fix
- **Build from source** — Compiling, patching, managing local modifications on top of upstream
- **Security hardening** — Vulnerability scanning, credential management, access controls

### References (shared, all layers)
- **OpenClaw codebase** — Key file locations, architecture, common patterns and error signatures
- **Project conventions** — Code style, commit messages, PR process, branch naming
- **Debugging checklist** — Systematic debugging steps applicable across all agents

### Shared Capabilities (all C-levels)
- **Safe artifact inspection** — Quarantine-based review of external/web-sourced content
- **Skill development** — Creating and improving skills through research-first methodology
- **Continuous improvement** — Self-assessment, performance tracking, process refinement (see Process docs)

## Continuous Improvement (all levels)

Every level of the hierarchy is responsible for:

1. **Self-improvement** — Observe own performance, identify weaknesses, iterate on approach
2. **Direct report check-ins** — Regularly verify tasks are progressing, not stalled or blocked
3. **Upward feedback** — Direct reports should flag when their manager's process, briefs, or instructions could be improved
4. **Downward feedback** — Managers provide actionable feedback to direct reports on output quality and process

This creates improvement feedback loops in both directions:
- **Director ↔ CEO** — Matthew flags what MEK can do better; MEK proposes process improvements to Matthew
- **CEO ↔ C-levels** — CEO reviews C-level output quality; C-levels flag unclear briefs or missing context
- **C-levels ↔ Task agents** — C-levels assess task agent output; patterns of poor output lead to skill/prompt improvements

Formal logging, metric collection, improvement plans, and implementation through agent/skill updates are documented in the [Process docs](processes/).

## Communication Protocol

### Director → CEO
- Direct chat (Telegram MEK group, gateway terminal)
- Strategic direction, approvals, feedback
- CEO executes autonomously within approved scope

### CEO → C-level
- Use `sessions_send` to persistent OpenClaw sub-agent sessions
- Include task context, expected deliverables, and priority
- Inject relevant OpenClaw skills at session creation
- C-levels reviews results, processes and filters and documents them before reporting back with structured updates

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
- C-Level are never to communicate externally, only the CEO does external communication
- External communications (email, social) require Director approval  
- Package installations require CEO or Director approval
- Git push operations require CEO or Director approval

### Elevated Access (Future, per Matthew's approval)
- Mechanic: host-level access for system repairs
- CTO: deployment permissions
- PA: email send permissions

### Data Boundaries
- C-levels may access personal context (MEMORY.md, USER.md, etc.) as needed for their role
- C-levels MUST NOT expose personal/sensitive information externally — only the CEO handles external communication
- C-levels can read from the main workspace but primarily operate/write in their designated subdirectories under `agent-workspaces/`
- Task agents get only the context they need (principle of least privilege and cost mitigation)

### Agent Workspaces
- Each C-level gets a dedicated workspace: `agent-workspaces/{cto,mechanic,pa}/`
- Workspaces live under the CEO's workspace tree so the CEO has full visibility
- Auth is shared from the CEO — no separate credentials per agent
- Each workspace has its own `.gitignore` for transient work artifacts
- Durable outputs (specs, skills, decisions) should be promoted to the main workspace tree
