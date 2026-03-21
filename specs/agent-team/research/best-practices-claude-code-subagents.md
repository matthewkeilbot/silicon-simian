# Best Practices: Claude Code Subagents

_Derived from analysis of the VoltAgent awesome-claude-code-subagents repo (127+ agents across 10 categories), Anthropic's official skill-creator skill, and the superpowers skill collection._

## 1. Anatomy of a Claude Code Subagent

### File Format
Claude Code subagents use **Markdown files** (`.md`) with YAML frontmatter, stored in agent directories.

```markdown
---
name: subagent-name
description: When this agent should be invoked
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

You are a [role description]...

[Checklists, patterns, guidelines]...

## Communication Protocol
[Inter-agent specs]...

## Development Workflow
[Structured phases]...
```

### Storage Locations
| Type | Path | Scope | Precedence |
|------|------|-------|------------|
| Project | `.claude/agents/` | Current project | Higher |
| Global | `~/.claude/agents/` | All projects | Lower |

Project-specific agents override global ones on name conflicts.

## 2. Frontmatter Design

### Fields
- `name`: Kebab-case identifier. Used for invocation and routing.
- `description`: **Critical trigger field.** Determines when Claude Code auto-invokes the agent. Include activation examples in XML-style tags for precision.
- `tools`: Comma-separated list of Claude Code built-in tools. Principle of least privilege.
- `model`: Routing hint — `opus`, `sonnet`, or `haiku`. Can also use `inherit` to match the parent conversation's model.

### Model Routing Philosophy
| Model | Use Case | Examples |
|-------|----------|---------|
| `opus` | Deep reasoning, security audits, architecture reviews | security-auditor, architect-reviewer |
| `sonnet` | Everyday coding, debugging, refactoring | python-pro, backend-developer |
| `haiku` | Quick tasks, docs, dependency checks | documentation-engineer, build-engineer |

### Tool Assignment Philosophy
- **Read-only agents** (reviewers, auditors): `Read, Grep, Glob`
- **Research agents** (analysts): `Read, Grep, Glob, WebFetch, WebSearch`
- **Code writers** (developers): `Read, Write, Edit, Bash, Glob, Grep`
- **Documentation agents**: `Read, Write, Edit, Glob, Grep, WebFetch, WebSearch`

Each agent gets **minimal necessary permissions**. Extend by adding MCP servers if needed.

## 3. Description Best Practices

### Trigger Design
Claude Code uses the description field to decide whether to **automatically invoke** a subagent. This is the most important field.

```markdown
description: |
  Use this agent when a major project step has been completed and needs 
  to be reviewed against the original plan. Examples: <example>Context: 
  User just finished implementing auth. user: "I've finished the auth 
  system" assistant: "Let me use code-reviewer to review"</example>
```

### Key Principles
1. **Be specific about activation conditions** — not just what the agent does, but when it should activate
2. **Include concrete examples** with `<example>` tags showing context → trigger scenarios
3. **Differentiate from similar agents** — if you have both a code-reviewer and an architect-reviewer, make their trigger boundaries crystal clear
4. **Use XML-style structuring** — Claude responds well to structured `<example>`, `<context>`, `<commentary>` tags

## 4. Instruction Body Patterns

### Role Definition Pattern
Start with a clear role statement that anchors the agent's expertise:
```markdown
You are a Senior Code Reviewer with expertise in software architecture, 
design patterns, and best practices. Your role is to review completed 
project steps against original plans and ensure code quality standards.
```

### Numbered Workflow Pattern
Structure the agent's work into numbered steps:
```markdown
1. **Plan Alignment Analysis**: Compare implementation against plan
2. **Code Quality Assessment**: Review patterns, error handling, types
3. **Architecture and Design Review**: SOLID, separation of concerns
4. **Documentation and Standards**: Comments, headers, conventions
5. **Issue Identification**: Critical / Important / Suggestion categories
```

### Communication Protocol Pattern
Define how agents communicate with each other and with the user:
```markdown
## Communication Protocol
- If significant deviations found, ask coding agent to review
- If issues in original plan, recommend plan updates
- Always acknowledge what was done well before highlighting issues
```

### Checklist Pattern
Include runnable checklists that agents work through:
```markdown
## Review Checklist
- [ ] All tests pass
- [ ] No security vulnerabilities introduced
- [ ] Error handling covers edge cases
- [ ] Documentation updated
- [ ] Breaking changes documented
```

## 5. Category Organization (VoltAgent Pattern)

The VoltAgent collection organizes agents into 10 clear categories. This taxonomy is a solid template for any agent organization:

1. **Core Development** — Frontend, backend, fullstack, API design
2. **Language Specialists** — Per-language/framework experts (TypeScript, Python, Rust, etc.)
3. **Infrastructure** — DevOps, cloud, containers, deployment
4. **Quality & Security** — Testing, code review, security audits, debugging
5. **Data & AI** — ML, data engineering, LLM architecture
6. **Developer Experience** — Tooling, docs, DX optimization, refactoring
7. **Specialized Domains** — Fintech, blockchain, gaming, IoT
8. **Business & Product** — PM, UX research, technical writing
9. **Meta & Orchestration** — Multi-agent coordination, context management
10. **Research & Analysis** — Web research, competitive analysis, trends

## 6. Sub-Agent Spawning Patterns

### Independent Context Windows
Every subagent operates in its own isolated context. This is a **key advantage** — prevents cross-contamination between tasks.

### Context Crafting
The parent agent should **craft the exact context** the sub-agent needs. Don't leak your full session history.

From superpowers:
> "You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history."

### Parallel Dispatch
When tasks are independent (no shared state, no sequential dependencies), dispatch agents in parallel:
```
When you have multiple unrelated failures (different test files, different 
subsystems, different bugs), investigating them sequentially wastes time. 
Each investigation is independent and can happen in parallel.
```

### Two-Stage Review Pattern (Superpowers)
After each task: spec compliance review first, then code quality review. Two different perspectives catch more issues than one.

## 7. Quality Standards from Top Skills

### The Superpowers Approach: Process as Documentation
The superpowers skills treat **process documentation** like code:
- Write test cases (pressure scenarios)
- Watch them fail (baseline behavior without skill)
- Write the skill (documentation)
- Watch tests pass (agents comply)
- Refactor (close loopholes)

### The Anthropic Approach: Eval-Driven Iteration
Anthropic's skill-creator follows a quantitative improvement loop:
1. Draft → Run test cases → Human review → Improve → Repeat
2. Blind A/B comparison between versions
3. Train/test split for description optimization
4. Benchmark with variance analysis (3+ runs)

### Iron Laws (Superpowers)
The best skills enforce non-negotiable principles:
- "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST" (systematic debugging)
- "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE" (verification)
- "ALWAYS find root cause before attempting fixes. Symptom fixes are failure."

These work because they're explained with reasoning, not just shouted.

## 8. Official Team Skill Patterns (from awesome-agent-skills)

The VoltAgent awesome-agent-skills repo catalogs 549+ skills published by actual engineering teams. Key patterns from these official skills:

### Platform Best Practices Pattern
Skills from Stripe, Supabase, Sanity, Neon, ClickHouse etc. codify **institutional knowledge** into portable skill packages. These are the highest-quality skills in the ecosystem because they're written by the team that built the platform.

### Upgrade/Migration Pattern
Expo, React Native, Stripe publish skills specifically for version upgrades. These have extremely high value-per-token because upgrades are error-prone and context-heavy.

### Framework Reference Pattern
Vercel (Next.js), Better Auth, Tinybird, HashiCorp (Terraform) provide framework-specific patterns and conventions. Agent uses these to avoid common mistakes and follow established patterns.

### Security Audit Pattern
Trail of Bits publishes security-focused skills. Sentry publishes error handling skills for their dev team. These establish a standard for how security/reliability skills should be structured.

## 9. Bulletproofing Discipline Skills

From the superpowers testing methodology (applicable to any agent system):

### Rationalization Tables
Build iteratively from real test failures. Every excuse agents make becomes a row:

| Excuse | Reality |
|--------|---------|
| "Keep as reference, write tests first" | You'll adapt it. That's testing-after. Delete means delete. |
| "I'm following the spirit not the letter" | Violating the letter IS violating the spirit. |
| "Too simple to need tests" | Simple code breaks. Test takes 30 seconds. |

### Red Flags Self-Check Lists
```markdown
If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I already manually tested it"
ALL of these mean: STOP. Return to Phase 1.
```

### The "Spirit vs Letter" Foundational Principle
Add early in any discipline skill: "Violating the letter of the rules is violating the spirit of the rules." This cuts off an entire class of rationalizations.

## 10. Anti-Patterns

1. **Over-permissioned agents**: Giving every agent `Read, Write, Edit, Bash`. Be restrictive.
2. **Vague descriptions**: "A helpful coding assistant" — won't trigger correctly.
3. **Workflow in descriptions**: Agent follows description shortcut instead of reading full instructions.
4. **Monolithic agents**: One agent that does everything. Specialize.
5. **No communication protocol**: Agents that don't define how they report results.
6. **Missing model routing**: Using opus for quick tasks or haiku for complex analysis.
7. **Inherited context leaking**: Passing full parent session to sub-agents instead of crafted briefs.
8. **No verification step**: Claiming work done without checking.
9. **Narrative examples**: "In session 2025-10-03..." — too specific, not reusable.
10. **Multi-language examples**: One excellent example in the most relevant language beats examples in 5 languages.
11. **Untested skills**: Deploying without TDD-style pressure testing = deploying untested code.

## 11. Security Considerations

- Review all community subagents before installing
- Restrict tool access to minimum needed (principle of least privilege)
- Be cautious with `Bash` tool — limit to necessary commands
- Don't embed secrets in agent definitions
- Use project-level agents for sensitive work (don't share globally)
- Audit agent descriptions for prompt injection vectors
- Prefer read-only tool sets for review/audit agents
