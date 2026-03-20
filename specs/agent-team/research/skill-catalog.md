# Skill Catalog — Agent Team Research

## Executive Summary

Analyzed three repositories to catalog available skills for the agent team:
- **Superpowers** (14 skills) — High-quality development workflow skills. Core of the CTO toolkit.
- **Anthropic Skills** (17 skills) — Production-grade document/content creation. Core of the PA toolkit.
- **Awesome OpenClaw Skills** (5400+ curated links) — Community directory. Source for discovery, not direct installation. Requires evaluation and safe-read before use.

## Superpowers Skills (Direct Use)

All superpowers skills are development-workflow focused. Quality is high — written with TDD methodology applied to process documentation.

| Skill | Description | Agent |
|-------|-------------|-------|
| brainstorming | Collaborative design before implementation. HARD GATE: no code without design approval | CTO |
| dispatching-parallel-agents | Dispatch independent tasks to parallel sub-agents | CTO |
| executing-plans | Execute written implementation plans with review checkpoints | CTO |
| finishing-a-development-branch | Guide branch completion: verify tests → present options → execute | CTO |
| receiving-code-review | Evaluate review feedback technically, don't blindly implement | CTO, Mechanic |
| requesting-code-review | Dispatch code-reviewer sub-agent for quality checks | CTO |
| subagent-driven-development | Execute plan via fresh sub-agent per task + two-stage review | CTO |
| systematic-debugging | Root cause analysis before any fixes. Iron law. | Mechanic |
| test-driven-development | Write test first, watch fail, write minimal code to pass | CTO, Mechanic |
| using-git-worktrees | Isolated workspaces for parallel branch work | CTO, Mechanic |
| using-superpowers | Meta-skill: find and invoke relevant skills before any response | General |
| verification-before-completion | No completion claims without fresh verification evidence | CTO, Mechanic |
| writing-plans | Comprehensive implementation plans for engineers with zero context | CTO |
| writing-skills | TDD applied to skill creation (meta-skill for skill development) | General |

### Superpowers Agents
- **code-reviewer.md** — Senior code reviewer agent. Checks plan alignment, code quality, architecture, docs. Categorizes issues as Critical/Important/Suggestions. → Direct use by CTO for review dispatching.

### Superpowers Hooks & Commands
- `hooks.json` — Session start hooks for skill loading
- Commands: `brainstorm.md`, `execute-plan.md`, `write-plan.md` — Slash command versions of skills

## Anthropic Skills (Adapt for Use)

These are Claude Code-native skills. Some need adaptation for OpenClaw (different tool names, workspace patterns).

| Skill | Description | Agent | Notes |
|-------|-------------|-------|-------|
| skill-creator | Create, test, and iterate on skills with eval framework | General | Key skill — adapt for our skill-development workflow |
| frontend-design | Production-grade frontend UI with anti-AI-slop aesthetics | CTO | Direct use |
| webapp-testing | Playwright-based web app testing | CTO | Adapt for our Playwright setup |
| mcp-builder | MCP server development guide | CTO | Direct use |
| doc-coauthoring | Structured documentation co-writing workflow | PA | Direct use |
| xlsx | Spreadsheet creation/editing/analysis | PA | Direct use |
| pdf | PDF read/extract/merge/fill/OCR | PA | Direct use |
| docx | Word document creation and manipulation | PA | Direct use |
| pptx | Presentation creation and editing | PA | Direct use |
| claude-api | Building apps with Claude/Anthropic SDK | CTO | Useful for integrations |
| internal-comms | Internal communications writing (status reports, updates) | PA | Adapt format for our needs |
| brand-guidelines | Anthropic brand styling (less relevant) | — | Skip |
| canvas-design | Visual art/poster creation | — | Low priority |
| algorithmic-art | Generative art with p5.js | — | Low priority |
| slack-gif-creator | GIF creation for Slack | — | Low priority |
| theme-factory | Theme application for artifacts | PA | Low priority |
| web-artifacts-builder | Multi-component web artifacts | CTO | Low priority |

## Awesome OpenClaw Skills — Top Picks by Role

### CTO Agent — Recommended for Evaluation

| Skill | Source | Why |
|-------|--------|-----|
| conventional-commits | bastos | Standardize commit message format |
| gh (GitHub CLI) | trumppo | Core GitHub operations integration |
| deslop | brennerspear | Remove AI code slop from branches |
| dependency-audit | fratua | Smart dependency health checks |
| cross-model-review | don-gbot | Adversarial review using two different models |
| agent-team-orchestration | arminnaimi | Multi-agent team management patterns |

### PA Agent — Recommended for Evaluation

| Skill | Source | Why |
|-------|--------|-----|
| gog | steipete | Google Workspace CLI (Gmail, Calendar, Drive, Contacts, Sheets, Docs) |
| gcal-pro | bilalmohamed187 | Google Calendar integration |
| morning-email-rollup | am-will | Daily email digest |
| briefing | lstpsche | Daily briefing (calendar + todos + weather) |
| cron-scheduling | gitgoodordietrying | Recurring task management |
| apple-reminders | steipete | Reminders integration (if applicable) |
| clickup-mcp | pvoo | Task management (if using ClickUp) |
| fastmail | witooh | Email and calendar via JMAP/CalDAV |

### Mechanic Agent — Recommended for Evaluation

| Skill | Source | Why |
|-------|--------|-----|
| clawdstrike | misirov | Security audit for OpenClaw hosts |
| emergency-rescue | gitgoodordietrying | Disaster recovery |
| agent-hardening | x1xhlol | Input sanitization testing |
| clawdbot-security-check | thesethrose | Comprehensive read-only security check |
| clawdbot-skill-update | pasogott | Backup, update, and restore workflow |
| cron-backup | zfanmy | Automated backup scheduling |
| nordvpn | maciekish | VPN management (if applicable) |

## OpenClaw Architecture Patterns (from docs)

### Agent Configuration
- Agents defined in `agents.list[]` in `openclaw.json`
- Each agent has: workspace, agentDir, session store, auth profiles
- Skills loaded from: workspace/skills > ~/.openclaw/skills > bundled
- Multi-agent routing via `bindings[]` (most-specific match wins)

### Skill System
- SKILL.md with YAML frontmatter (name, description required)
- Gating via `metadata.openclaw.requires` (bins, env, config)
- Three locations: bundled, managed (~/.openclaw/skills), workspace (skills/)
- Per-agent skills via workspace isolation
- ClawHub for community skill installation

### Sub-Agent Patterns
- `sessions_spawn` with `mode="run"` (one-shot) or `mode="session"` (persistent)
- `sessions_send` for messaging persistent sessions
- `sessions_yield` after spawning to receive results
- Task context crafted per-spawn (don't leak parent context)

### Cron / Automation
- Gateway-based scheduler, persists under ~/.openclaw/cron/
- Isolated or main session execution
- Webhook delivery option
- Cron for exact timing, heartbeat for batched periodic checks

## Recommendations

### Immediate Actions (Phase 1)
1. **Install superpowers skills** into workspace/skills for CTO and Mechanic
2. **Install anthropic document skills** (xlsx, pdf, docx, pptx, doc-coauthoring) for PA
3. **Adapt anthropic/skill-creator** into our skill-development workflow (merge with existing)
4. **Build 3 custom skills**: openclaw-internals, email-calendar, tech-lead

### Evaluation Queue (Phase 2)
1. Safe-read and evaluate `gog` skill for PA (Google Workspace integration — critical for email/calendar)
2. Safe-read and evaluate `clawdstrike` for Mechanic (security auditing)
3. Safe-read and evaluate `conventional-commits` for CTO (commit standards)
4. Safe-read and evaluate `cross-model-review` for CTO (multi-model code review)

### Build Queue (Phase 3)
1. `openclaw-internals` skill for Mechanic (from openclaw source docs)
2. `linux-admin` skill for Mechanic (Ubuntu 24.04 focused)
3. `git-operations` skill for Mechanic (cherry-pick, build-from-source workflows)
4. `email-calendar` skill for PA (Google Workspace integration)
5. `web-research` skill for PA (structured research workflow)
6. `tech-lead` skill for CTO (orchestration patterns, escalation protocols)
