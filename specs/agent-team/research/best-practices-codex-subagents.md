# Best Practices: Codex Subagents

_Derived from analysis of the VoltAgent awesome-codex-subagents repo (136+ agents across 10 categories) and the official Codex documentation._

## 1. Anatomy of a Codex Subagent

### File Format
Codex subagents use **TOML files** (`.toml`) — this is a key difference from Claude Code's Markdown format.

```toml
name = "subagent-name"
description = "When this agent should be invoked"
model = "gpt-5.3-codex-spark"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"

[instructions]
text = """
You are a [role description]...

[Checklists, patterns, guidelines]...
"""
```

### Storage Locations
| Type | Path | Scope | Precedence |
|------|------|-------|------------|
| Project | `.codex/agents/` | Current project | Higher |
| Global | `~/.codex/agents/` | All projects | Lower |

Additional config: `.codex/config.toml` under `[agents]` section.

## 2. Key Differences from Claude Code

### TOML vs Markdown
- Codex uses **structured TOML** with typed fields
- Claude Code uses **Markdown** with YAML frontmatter
- TOML enforces stricter formatting (no ambiguous field types)
- Instructions go in `[instructions].text` as a multi-line TOML string

### Explicit Delegation (Critical Difference)
**Codex does NOT automatically spawn subagents.** This is the biggest behavioral difference from Claude Code.

- Claude Code: Agent reads descriptions and auto-invokes matching subagents
- Codex: User must **explicitly delegate** in prompts

This means:
- Description field is less about triggering and more about documentation
- Prompt engineering at the parent level is more important
- Workflow instructions need to tell the user _how_ to invoke subagents

### Sandbox Mode (Codex-Specific)
Codex has a native `sandbox_mode` field that controls filesystem access:

| Mode | Description | Use Case |
|------|-------------|----------|
| `read-only` | Can read files but not modify | Reviewers, auditors, researchers |
| `workspace-write` | Can read and write files | Developers, engineers, writers |

This is a first-class security primitive. Claude Code handles this through the `tools` field instead.

### Model Routing
| Model | When Used | Examples |
|-------|-----------|---------|
| `gpt-5.4` | Deep reasoning, architecture, security | security-auditor, architect-reviewer |
| `gpt-5.3-codex-spark` | Fast scanning, synthesis, research | search-specialist, docs-researcher |

### Reasoning Effort
Codex adds a `model_reasoning_effort` field:
- `"high"` — Complex analysis, architecture decisions
- `"medium"` — Standard coding tasks
- `"low"` — Quick lookups, simple formatting

This fine-grained control doesn't exist in Claude Code's model routing.

## 3. Description Writing for Codex

Since Codex requires explicit delegation, the description serves a different purpose:

### Primary Purpose: Documentation for the User/Orchestrator
Rather than triggering auto-invocation, the description tells the **orchestrating agent or user** when to use this subagent.

### Secondary Purpose: Prompt Context
When explicitly invoked, the description provides additional context about the agent's expertise.

### Pattern
```toml
description = "PR-style review for correctness, security, and regressions. Use when a branch is ready for merge or after significant code changes."
```

### Codex Description vs Claude Code Description
| Aspect | Claude Code | Codex |
|--------|-------------|-------|
| Primary role | Auto-trigger mechanism | Documentation |
| Format | Markdown string | TOML string |
| Examples needed | Yes (crucial for triggering) | Helpful but not critical |
| Exclusions ("Do NOT use") | Important for avoiding false triggers | Less important (no auto-trigger) |

## 4. Instruction Body Patterns

### Multi-Line TOML Strings
```toml
[instructions]
text = """
You are a Senior Backend Developer specializing in...

## Process
1. Read the requirements
2. Analyze the codebase
...

## Constraints
- Always write tests
- Never modify existing APIs without migration plan
"""
```

### Structured Workflow Pattern
Codex subagents benefit from very explicit step-by-step workflows since they don't share conversational context:

```toml
[instructions]
text = """
## Step 1: Understand the Task
Read the provided files and summarize what needs to change.

## Step 2: Plan the Approach
List files to modify and describe each change.

## Step 3: Implement
Make changes following the plan. Write tests for each change.

## Step 4: Verify
Run tests. Check for regressions. Summarize what was done.
"""
```

### Example Workflow Prompts (User-Side)
Since Codex requires explicit delegation, the docs provide example prompts:

```
Review this branch with parallel subagents. Have reviewer look for 
correctness, security, and missing tests. Have docs_researcher verify 
the framework APIs this patch depends on. Wait for both and summarize 
the findings with file references.
```

```
Investigate the broken settings flow. Have code_mapper trace the owning 
code paths, browser_debugger reproduce the bug in the browser, and 
frontend_developer propose the smallest fix after the failure is understood.
```

## 5. Category Organization

Codex uses the same 10-category taxonomy as Claude Code (VoltAgent standardized this):

1. Core Development (12 agents)
2. Language Specialists (27 agents)
3. Infrastructure (16 agents)
4. Quality & Security (16 agents)
5. Data & AI (12 agents)
6. Developer Experience (13 agents)
7. Specialized Domains (12 agents)
8. Business & Product (11 agents)
9. Meta & Orchestration (12 agents — includes agent-installer)
10. Research & Analysis (7 agents)

### Codex-Specific Additions
- `browser-debugger` — Browser-based reproduction and client-side debugging (uses Codex's browser integration)
- `code-mapper` — Code path mapping and ownership boundary analysis
- `ui-fixer` — Smallest safe patch for reproduced UI issues
- `docs-researcher` — Documentation-backed API verification
- `reviewer` — PR-style review (distinct from code-reviewer, focused on merge readiness)
- `erlang-expert` — Codex added Erlang/OTP coverage not in Claude collection

## 6. Parallel Sub-Agent Patterns

### Explicit Orchestration
Since Codex doesn't auto-spawn, orchestration patterns are more explicit and user-driven:

**Investigation Pattern:**
```
Use search_specialist to locate the code related to [feature],
knowledge_synthesizer to summarize the current design,
and refactoring_specialist to propose a minimal refactor plan.
Return a concrete action list.
```

**Review Pattern:**
```
Have reviewer look for correctness and regressions.
Have security-auditor check for vulnerabilities.
Wait for both and merge findings.
```

**Build Pattern:**
```
Have frontend-developer build the component.
Have test-automator write tests.
Have code-reviewer review both.
Serial: test → review happens after build.
```

### Wait-and-Merge
Codex patterns explicitly mention "wait for" and "merge findings" — since sub-agents don't auto-coordinate, the parent prompt handles ordering.

## 7. Codex-Specific Best Practices

### 1. Sandbox Mode as Security Primitive
Always set `sandbox_mode`. Default to `read-only` unless the agent genuinely needs to write:
- Reviewers, auditors, researchers → `read-only`
- Developers, fixers, writers → `workspace-write`

### 2. Reasoning Effort Tuning
Use `model_reasoning_effort` to balance quality vs speed:
- `"high"` for architecture and security decisions
- `"medium"` for standard development
- `"low"` for formatting, simple lookups, dependency checks

### 3. Config.toml Integration
For project-wide agent settings:
```toml
# .codex/config.toml
[agents]
default_model = "gpt-5.3-codex-spark"
default_sandbox = "read-only"
```

### 4. Explicit Instructions for Parallel Work
Since auto-spawning doesn't exist, include orchestration hints in your project's AGENTS.md or README:
```markdown
## Available Subagents
- `reviewer` — Use for PR review (read-only)
- `frontend-developer` — Use for React/UI work (workspace-write)
- `security-auditor` — Use for security review (read-only)

## Common Workflows
- Before merge: `reviewer` + `security-auditor` in parallel
- New feature: `frontend-developer` then `reviewer`
```

## 8. Anti-Patterns

1. **Expecting auto-invocation**: Codex won't auto-spawn agents. Always delegate explicitly.
2. **Wrong sandbox mode**: Using `workspace-write` for a reviewer that should only read.
3. **Missing reasoning effort**: Not tuning `model_reasoning_effort` — wastes tokens on simple tasks.
4. **Markdown agent files**: Using `.md` format instead of `.toml` — Codex won't load them.
5. **Monolithic instructions**: Putting everything in one giant TOML string without structure.
6. **No orchestration docs**: Not telling users/parent agents how to invoke and combine subagents.
7. **Over-specifying model**: Pinning to `gpt-5.4` for tasks that `spark` handles fine.

## 9. Security Considerations

- `sandbox_mode = "read-only"` is the strongest security posture for review/audit agents
- Review all community agents before installing
- Keep sensitive project agents in `.codex/agents/` (project-level, not global)
- Don't embed secrets in TOML instruction text
- Be explicit about what files the agent should and shouldn't access
