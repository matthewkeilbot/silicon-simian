# Compare/Contrast: OpenClaw Skills vs Claude Code Subagents vs Codex Subagents

## Executive Summary

Three distinct ecosystems for extending AI agent capabilities, each with different philosophies, file formats, and triggering mechanisms. All three are converging on the AgentSkills open standard (agentskills.io) — now supported by 30+ agent platforms including Claude Code, Codex, Gemini CLI, Cursor, GitHub Copilot, and VS Code. OpenClaw is the most mature for autonomous multi-agent operation. Claude Code pioneered the subagent model for developer workflows. Codex adopted a similar taxonomy but with explicit-delegation and native sandbox controls.

A fourth ecosystem — **official team skills** — cuts across all three platforms. Companies like Stripe, Supabase, Vercel, Google, Cloudflare, Trail of Bits, and Expo publish skills that work across any AgentSkills-compatible platform. These represent the highest quality tier because they encode institutional knowledge from the team that built the platform.

## Structural Comparison

| Aspect | OpenClaw Skills | Claude Code Subagents | Codex Subagents |
|--------|----------------|----------------------|-----------------|
| **File Format** | Markdown (SKILL.md) with YAML frontmatter | Markdown (.md) with YAML frontmatter | TOML (.toml) with structured fields |
| **Location** | `<workspace>/skills/`, `~/.openclaw/skills/` | `.claude/agents/`, `~/.claude/agents/` | `.codex/agents/`, `~/.codex/agents/` |
| **Ecosystem Size** | 13,700+ on ClawHub (5,400 curated) | 127+ in VoltAgent collection | 136+ in VoltAgent collection |
| **Bundled Content** | Skills ship with install + plugins | None bundled | None bundled |
| **Multi-file Support** | Yes (scripts/, references/, assets/, evals/) | Single .md file per agent | Single .toml file per agent |
| **Gating System** | Rich (bins, env, config requirements) | None (tools field only) | Sandbox mode (read-only/workspace-write) |
| **Registry** | ClawHub (install/update/publish) | GitHub repos, manual copy | GitHub repos, manual copy |

## Triggering and Invocation

| Aspect | OpenClaw | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Auto-invocation** | Yes — description-based | Yes — description-based | **No** — explicit delegation only |
| **Description role** | Primary trigger mechanism | Primary trigger mechanism | Documentation only |
| **Description format** | Imperative voice, user-intent focused | Includes `<example>` XML tags | Simple string |
| **Trigger optimization** | Formal eval framework (train/test split) | Possible via skill-creator | N/A (no auto-trigger) |
| **User invocation** | Slash commands (`/skill-name`) | Direct request ("use X agent") | Explicit prompt delegation |

**Key insight:** This is the biggest architectural difference. OpenClaw and Claude Code both have a "passive discovery" model where the agent reads descriptions and decides whether to invoke. Codex uses "active delegation" where the user or orchestrator explicitly tells it which sub-agent to use.

**Implications:**
- OpenClaw/Claude Code: Description quality is critical (bad descriptions → wrong triggers)
- Codex: Orchestration instructions are critical (users need to know when/how to delegate)
- OpenClaw: More autonomy, less user involvement in routing
- Codex: More control, less surprise — user always knows which agent is active

## Model Routing

| Aspect | OpenClaw | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Primary models** | Opus, Sonnet (Anthropic); Codex 5.3/5.4 (OpenAI) | Opus, Sonnet, Haiku (Anthropic) | GPT-5.4, GPT-5.3 Codex Spark |
| **Model field** | `model` in agent config or per-session override | `model` in frontmatter (opus/sonnet/haiku/inherit) | `model` in TOML (full model name) |
| **Reasoning control** | None (model-specific) | None | `model_reasoning_effort` (high/medium/low) |
| **Multi-provider** | Yes (25+ providers) | Anthropic only | OpenAI only |
| **Failover** | Native (`model.fallbacks`) | None | None |

**Key insight:** OpenClaw is the only platform with native multi-provider support and model failover. Claude Code is Anthropic-only. Codex is OpenAI-only. Codex adds reasoning effort tuning as a unique feature.

## Security Models

| Aspect | OpenClaw | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Sandbox** | Optional Docker sandbox, per-agent or shared | None (host access through tools) | Native sandbox mode (read-only/workspace-write) |
| **Tool control** | Per-agent `tools.allow`/`tools.deny` lists | Per-agent `tools` field (explicit list) | `sandbox_mode` field (coarse-grained) |
| **Elevated ops** | Global `tools.elevated` with approval gates | System-level tool permissions | N/A |
| **Skill vetting** | ClawHub + VirusTotal; community scanners | Manual review only | Manual review only |
| **Secret management** | `skills.entries.*.env`, `skills.entries.*.apiKey` | Environment-based | Environment-based |

**Key insight:** OpenClaw has the most sophisticated security model (Docker sandboxing, per-agent tool control, approval gates, registry vetting). Codex's `sandbox_mode` is a clean, simple primitive. Claude Code relies entirely on tool permissions.

## Skill/Agent Richness

| Aspect | OpenClaw | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Multi-file skills** | Yes — scripts, references, assets, evals | No — single markdown file | No — single TOML file |
| **Helper scripts** | Bundled in `scripts/` directory | Inline instructions only | Inline instructions only |
| **Eval framework** | Full (evals.json, grader, blind comparison, benchmarks) | None | None |
| **Reference docs** | Dedicated `references/` directory | Must be inline or external | Must be inline |
| **Plugins** | Skills can be part of plugins | N/A | N/A |
| **Progressive disclosure** | Natural (SKILL.md → references → scripts) | All in one file | All in one TOML string |

**Key insight:** OpenClaw skills are significantly richer. A skill can be a full package with scripts, docs, assets, and test suites. Claude Code and Codex subagents are lean single-file definitions — easier to create but less powerful.

## Session and Context Management

| Aspect | OpenClaw | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Session types** | Persistent (`mode="session"`) and one-shot (`mode="run"`) | Independent context per subagent | Independent context per subagent |
| **Cross-agent comms** | `sessions_send`, `sessions_spawn`, configurable `agentToAgent` | Implicit via parent context | Implicit via parent prompt |
| **Context isolation** | Per-agent workspaces, sandboxes | Per-subagent context window | Per-subagent context + sandbox |
| **Memory** | Plugin-based memory system (in development) | Per-project CLAUDE.md | None built-in |
| **Multi-agent routing** | Full routing system (bindings, peer matching, account mapping) | N/A (single user) | N/A (single user) |

**Key insight:** OpenClaw is designed for autonomous, multi-agent operation. It has routing, bindings, multi-workspace, and persistent sessions. Claude Code and Codex are designed as developer tools — single user, project-scoped, transient sessions.

## Orchestration Patterns

### OpenClaw: Hub-and-Spoke
```
CEO (main agent)
├── sessions_spawn(mode="session") → Persistent C-level agents
│   └── sessions_spawn(mode="run") → One-shot task agents
├── sessions_send → Message persistent agents
├── cron jobs → Scheduled tasks
└── heartbeat → Periodic checks
```

### Claude Code: Auto-Dispatch
```
Main conversation
├── Agent detects need → auto-spawns matching subagent
│   └── Subagent works in isolated context
├── User explicitly requests → spawns named subagent
└── Result flows back to main conversation
```

### Codex: Explicit Delegation
```
User prompt with delegation instructions
├── "Have reviewer check..." → spawns reviewer
├── "Have frontend-developer build..." → spawns frontend-dev
├── "Wait for both..." → parent manages ordering
└── Merged results returned
```

## Ecosystem and Community

| Aspect | OpenClaw | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Registry** | ClawHub (13,700+ skills) | No central registry | No central registry |
| **Curation** | VoltAgent curates 5,400 | VoltAgent curates 127+ | VoltAgent curates 136+ |
| **Quality filtering** | Yes (spam, malware, dupes removed) | Manual curation only | Manual curation only |
| **Security scanning** | VirusTotal partnership, Snyk scanner | None | None |
| **Install tooling** | `clawhub install <slug>` | `claude plugin install` or manual copy | Manual copy |
| **Skill creation tools** | Anthropic skill-creator (eval + benchmark suite) | N/A | N/A |

**Key insight:** OpenClaw has a massive ecosystem but also massive noise (7,000+ skills filtered as spam/malware/dupes). Claude Code and Codex have small, curated collections with consistent quality but limited coverage.

## When to Use Which

### OpenClaw Skills are best for:
- **Autonomous agents** that need to operate independently
- **Complex workflows** requiring scripts, references, and multi-step processes
- **Multi-agent organizations** with routing and role-based access
- **Integration-heavy tasks** (email, calendar, APIs, smart home)
- **Skills that need helper scripts** (document processing, data transformation)
- **Production deployments** with security requirements

### Claude Code Subagents are best for:
- **Developer workflows** during active coding sessions
- **Auto-triggered assistance** based on task context
- **Quick specialization** (single-file, easy to create)
- **Team standardization** (shared agents for consistent practices)
- **Anthropic model ecosystem** (natural fit for Claude models)

### Codex Subagents are best for:
- **Controlled delegation** where you want explicit routing
- **Security-sensitive work** (native sandbox mode)
- **Structured task decomposition** (clear parent-child patterns)
- **OpenAI model ecosystem** (natural fit for GPT models)
- **Enterprise environments** where predictable behavior matters (no surprise auto-spawning)

## Recommendations for MEK Agent Team

Given our multi-model, multi-agent architecture:

1. **Primary format: OpenClaw skills** — Our agents run on OpenClaw, so skills should follow the OpenClaw format for installation and auto-discovery.

2. **Borrow patterns from all three ecosystems:**
   - OpenClaw's multi-file structure and progressive disclosure
   - Claude Code's `<example>` tag pattern for better descriptions
   - Codex's `sandbox_mode` philosophy for per-agent security
   - Superpowers' iron law approach for critical process rules

3. **Description strategy:** Since our agents use auto-invocation (OpenClaw-style), descriptions must be trigger-optimized. Use the anthropic skill-creator eval methodology to test.

4. **Agent definition strategy:** For C-level persistent agents, use rich markdown context files (like OpenClaw's AGENTS.md pattern) rather than single-file subagent definitions. For one-shot task agents, keep it lean like Codex TOML definitions.

5. **Security strategy:** Adopt Codex's sandbox philosophy — all review/audit agents should be read-only by default. Implement OpenClaw's per-agent `tools.allow`/`tools.deny` for fine-grained control.

6. **Model diversity:** Leverage OpenClaw's multi-provider support to assign the right model per task (Opus for strategy, Codex for implementation, Gemini for review diversity).

7. **Testing methodology:** Apply the superpowers TDD approach for process/discipline skills (pressure testing with rationalization capture) and the anthropic skill-creator approach for capability skills (eval-driven iteration with blind comparison). These are complementary, not competing.

8. **Official team skills as foundation:** Where available, prefer official team skills (Stripe, Supabase, etc.) over community alternatives. They're higher quality, maintained by the platform team, and cross-platform compatible.

9. **Conciseness discipline:** Follow Anthropic's official guidance — the context window is a public good. Every token in a skill competes with conversation history, other skills, and the actual task. Default assumption: the model is already smart. Only add what it doesn't know.
