# Best Practices: OpenClaw Skills

_Derived from analysis of 5,400+ curated community skills, OpenClaw official docs, the AgentSkills spec (agentskills.io), Anthropic's official authoring best practices (platform.claude.com), the superpowers skill collection, Anthropic's skill-creator with eval framework, the VoltAgent awesome-agent-skills collection (549+ official skills from Anthropic, Google, Stripe, Vercel, Cloudflare, etc.), and the writing-skills meta-skill with TDD-based testing methodology._

## 1. Anatomy of an OpenClaw Skill

### Required Structure
```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Optional: helper scripts (Python, bash, etc.)
├── references/           # Optional: static reference docs
├── assets/               # Optional: templates, HTML viewers, etc.
└── evals/                # Optional: test cases (evals.json + input files)
```

### SKILL.md Format
```markdown
---
name: kebab-case-name
description: Imperative-voice description under 1024 chars. Focus on user intent, not implementation.
---

# Skill Title

[Instructions body — workflow, rules, examples]
```

### Frontmatter Rules
- `name`: **Required.** Kebab-case, lowercase, max 64 characters. No leading/trailing hyphens or double hyphens.
- `description`: **Required.** Under 1024 characters. No angle brackets (`<>`). Written in imperative voice ("Use when..." not "This skill does...").
- `metadata`: Optional single-line JSON for gating (`requires.bins`, `requires.env`, `requires.config`).
- `license`: Optional but recommended for shared skills.
- `allowed-tools`: Optional list of tools the skill needs.
- No other frontmatter keys are permitted per the AgentSkills spec.

## 2. Description Writing (The Most Critical Field)

The description is the **primary trigger mechanism** — it determines whether the agent invokes the skill. This is the single highest-leverage thing to get right. The description is loaded for ALL skills at startup and competes for context with every other skill's description.

### The Trap: Don't Summarize the Workflow

**Critical finding from superpowers testing:** When a description summarizes the skill's workflow, the agent may follow the description instead of reading the full SKILL.md. A description saying "code review between tasks" caused the agent to do ONE review, even though the skill's flowchart showed TWO reviews (spec compliance then code quality).

When the description was changed to just triggering conditions (no workflow summary), the agent correctly read and followed the full skill instructions.

**Rule:** Description = WHEN to use. Never WHAT the skill does internally.

### Principles
- **Third person always** — Description is injected into system prompt. "Processes Excel files" not "I can help with Excel."
- **Triggering conditions only** — "Use when encountering any bug, test failure, or unexpected behavior" not "Systematically investigates bugs using a four-phase process."
- **User intent focused** — Describe the user's problem, not the skill's implementation.
- **Technology-agnostic triggers** unless skill is technology-specific — "Use when tests have race conditions" not "Use when tests use setTimeout."
- **Distinctive** — Must compete cleanly against 100+ other skill descriptions loaded simultaneously.
- **Include exclusions** — "Do NOT use for..." prevents false triggers against adjacent skills.
- **Under 1024 chars** — Hard spec limit. Aim for under 500 chars for optimal triggering.

### Good Description Pattern
```yaml
# ✅ Triggering conditions only, no workflow summary
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes

# ✅ Specific file types and user intent
description: Use when the user wants to create, read, edit, or manipulate Word documents (.docx files). Triggers include any mention of 'Word doc', '.docx', or requests to produce professional documents.

# ❌ Summarizes workflow — agent may follow this instead of reading skill
description: Use when debugging - traces root cause through four phases then fixes

# ❌ Too vague — competes with everything
description: Helps with documents
```

### Description Optimization (Eval-Driven)

For high-impact skills, use the anthropic skill-creator's formal evaluation methodology:
1. Write 20 eval queries (10 should-trigger, 10 should-not-trigger)
2. Make queries realistic with concrete details, not abstract
3. Run train/test split (60/40) evaluation
4. Iterate descriptions based on what fails
5. Select best description by test score (not train) to avoid overfitting

## 3. Instruction Body Best Practices

### Progressive Disclosure (The Three-Layer Architecture)

From the AgentSkills spec and Anthropic's official guidance:

1. **Layer 1 — Metadata** (~100 tokens): `name` and `description` loaded at startup for ALL skills
2. **Layer 2 — Instructions** (<5000 tokens recommended, <500 lines): Full SKILL.md body loaded when skill activates
3. **Layer 3 — Resources** (as needed): Files in scripts/, references/, assets/ loaded only when required

**Key rule:** References should be ONE level deep from SKILL.md. Avoid nested reference chains — agents may partially read files referenced from other referenced files (using `head -100` previews instead of full reads).

For reference files >100 lines, include a table of contents at the top so the agent can see full scope even in partial reads.

### Conciseness: The Context Window is a Public Good

From Anthropic's official best practices:

> **Default assumption: Claude is already very smart.** Only add context the model doesn't already have. Challenge each piece of information: "Does the model really need this explanation?" "Can I assume it knows this?" "Does this paragraph justify its token cost?"

**Token budget targets** (from superpowers writing-skills):
- Getting-started / frequently-loaded skills: <150 words each
- Other frequently-loaded skills: <200 words total
- Standard skills: <500 words

**Compression techniques:**
- Reference `--help` instead of documenting all flags
- Cross-reference other skills instead of repeating instructions
- One excellent example beats many mediocre ones
- Eliminate redundancy with cross-references

### Degrees of Freedom (Anthropic Framework)

Match specificity to the task's fragility:

| Freedom Level | When to Use | Format |
|--------------|-------------|--------|
| **High** | Multiple valid approaches, context-dependent | Text instructions, heuristics |
| **Medium** | Preferred pattern exists, some variation OK | Pseudocode, parameterized scripts |
| **Low** | Fragile operations, consistency critical | Exact scripts, no modification allowed |

**Analogy:** Narrow bridge with cliffs = low freedom (exact commands). Open field = high freedom (general direction).

### Explain the Why (Not Just the What)

Don't just list rules — explain **why** each rule exists. This leads to better generalization than rigid MUST/NEVER lists.

Bad: `ALWAYS validate output before returning.`
Better: `Validate output before returning because unverified claims erode user trust and can cascade into downstream errors.`

Reserve ALL CAPS and MUST/NEVER for truly critical safety rules. Over-use dilutes their power.

### Workflow Structure with Feedback Loops

**Checklists for complex tasks:**
```markdown
Copy this checklist and track progress:
- [ ] Step 1: Analyze input
- [ ] Step 2: Create mapping
- [ ] Step 3: Validate
- [ ] Step 4: Execute
- [ ] Step 5: Verify output
```

**Feedback loops** dramatically improve quality:
```
Run validator → fix errors → re-validate → repeat until clean
```

### Script Bundling (From Real Testing Data)

If your test cases show that agents independently write similar helper scripts, **bundle the script** in `scripts/`. Write it once, tell the skill to use it. This saves every future invocation from reinventing the wheel. (Observed pattern from anthropic skill-creator eval runs.)

## 4. Gating and Prerequisites

### Environment Gating
Use metadata to prevent skills from loading when prerequisites are missing:
```yaml
metadata: {"openclaw": {"requires": {"bins": ["uv", "ffmpeg"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"]}}}
```

### Graceful Degradation
When a skill can partially function without all dependencies, document fallback behavior rather than hard-gating everything.

## 5. Security Considerations

### For Skill Authors
- Treat all user input as untrusted
- Never embed secrets in SKILL.md or scripts
- Use `skills.entries.*.env` and `skills.entries.*.apiKey` for secret injection
- Don't include instructions that could override system prompts
- Don't use encoded/obfuscated content
- Don't include shell commands that allow arbitrary injection
- Don't load external URLs at runtime

### For Skill Consumers
- Always review third-party skills before installing
- Use the `safe-download-and-read` workflow for external skills
- Check ClawHub's VirusTotal reports
- Prefer sandboxed runs for untrusted skills

## 6. Installation and Distribution

### Locations (precedence: workspace > local > bundled)
| Location | Path | Scope |
|----------|------|-------|
| Workspace | `<workspace>/skills/` | Current agent only |
| Local/Managed | `~/.openclaw/skills/` | All agents |
| Bundled | Shipped with install | All agents |
| Extra dirs | `skills.load.extraDirs` | All agents (lowest) |

### Per-Agent Skills
In multi-agent setups, workspace skills are per-agent. Shared skills go to `~/.openclaw/skills/`.

### ClawHub
- Install: `clawhub install <skill-slug>`
- Update: `clawhub update --all`
- Publish: `clawhub sync --all`

## 7. Testing and Evaluation

### The Superpowers TDD Methodology (For Process/Discipline Skills)

Writing skills IS TDD applied to process documentation. Same RED-GREEN-REFACTOR cycle:

**RED Phase — Baseline Testing:**
1. Create pressure scenarios with 3+ combined pressures (time + sunk cost + exhaustion)
2. Run scenarios WITHOUT the skill
3. Document agent failures and rationalizations **verbatim**
4. Identify patterns in how agents rationalize violations

**GREEN Phase — Write Minimal Skill:**
1. Write skill addressing ONLY the specific rationalizations observed
2. Don't add content for hypothetical cases
3. Run same scenarios WITH skill — agent should now comply

**REFACTOR Phase — Close Loopholes:**
1. Identify NEW rationalizations from testing
2. Add explicit counters for each (rationalization table, red flags list)
3. Add "Violating the letter of the rules is violating the spirit" as foundational principle
4. Re-test until bulletproof under maximum pressure
5. Use meta-testing: "You read the skill and chose wrong anyway. How could the skill be clearer?"

**Pressure types for testing:** Time, sunk cost, authority, economic, exhaustion, social ("looking dogmatic"), pragmatic ("being pragmatic vs dogmatic"). Best tests combine 3+ pressures.

### The Anthropic Skill-Creator Methodology (For Capability Skills)

Quantitative improvement loop:
1. **Draft** the skill
2. **Write test cases** (evals.json) with prompts, expected outputs, and assertions
3. **Run test cases** with and without the skill (baseline comparison)
4. **Grade** outputs against assertions (grader agent checks PASS/FAIL with evidence)
5. **Blind comparison** between versions (comparator agent judges without knowing which is which)
6. **Get human review** via eval viewer (outputs tab + benchmark tab)
7. **Iterate** based on feedback — generalize from failures, don't overfit
8. **Benchmark** with variance analysis (3+ runs per configuration)
9. **Optimize description** with train/test split and trigger evaluation

### The AgentSkills Spec Validation
```bash
skills-ref validate ./my-skill
```
Checks frontmatter validity and naming conventions against the official spec.

### Quick Validation (from anthropic skill-creator)
```bash
python -m scripts.quick_validate <skill_directory>
```
Checks: frontmatter exists, name/description present, kebab-case naming, character limits, no unexpected keys.

## 8. Common Patterns in High-Quality Skills

### From community analysis (awesome-openclaw-skills, 5400+ skills):

1. **CLI wrapper pattern**: Skill wraps an existing CLI tool (e.g., `gog` for Google Workspace, `bird` for X/Twitter). Provides usage instructions, common workflows, and error handling.

2. **API integration pattern**: Provides API endpoint details, auth setup, and common query patterns. Often includes scripts for token management.

3. **Workflow orchestration pattern**: Multi-step process with decision points, gates, and checkpoints (superpowers excels here).

4. **Sub-agent dispatch pattern**: Instructions on how/when to spawn sub-agents with crafted context. Defines result collection and review.

5. **Memory/state pattern**: Manages persistent state across sessions via markdown files or JSON in workspace.

### From official team skills (awesome-agent-skills, 549+ from Anthropic/Google/Stripe/Vercel/etc.):

6. **Best practices pattern**: Captures domain expertise for a specific platform (e.g., Supabase Postgres best practices, Stripe integration patterns, HashiCorp Terraform code generation). Written by the platform team, not third parties.

7. **Upgrade/migration pattern**: Step-by-step guides for upgrading SDK versions or migrating between APIs (Stripe upgrade, Expo upgrade, React Native upgrade). These skills have high token-per-use value because upgrades are error-prone.

8. **Domain reference pattern**: Comprehensive reference material with progressive disclosure (BigQuery datasets organized by domain → finance.md, sales.md, product.md). Agent reads only the relevant domain file.

### From the superpowers methodology:

9. **Iron law pattern**: Non-negotiable principle stated once, enforced everywhere. "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST." Works because it's explained with reasoning, not just shouted.

10. **Rationalization table pattern**: Documents every excuse agents make for violating rules, paired with reality checks. Built iteratively through TDD testing. Prevents loopholes.

11. **Red flags self-check pattern**: List of thoughts that signal the agent is about to violate the skill. "If you're thinking 'just try changing X and see if it works' — STOP."

12. **Cross-reference pattern**: Skills reference each other with explicit requirement markers: `**REQUIRED:** Use superpowers:test-driven-development`. Never force-load with `@` syntax (burns context).

## 9. What Separates Good from Great

| Aspect | Good | Great |
|--------|------|-------|
| Description | Accurate trigger words | Tested with train/test eval split |
| Instructions | Clear steps | Explains why behind each step |
| Error handling | Mentions common errors | Provides specific recovery procedures |
| Scripts | Inline instructions | Bundled reusable scripts |
| Testing | Manual testing | Automated evals with assertions |
| Docs | Usage examples | Progressive disclosure with references |
| Security | Avoids obvious issues | Explicit threat model and mitigations |

## 10. Naming Conventions

From Anthropic's official guidance and superpowers:

- **Gerund form** (-ing) works well for processes: `creating-skills`, `testing-code`, `debugging-with-logs`
- **Active voice, verb-first**: `condition-based-waiting` not `async-test-helpers`
- **Name by core insight**: `flatten-with-flags` not `data-structure-refactoring`
- **Avoid**: `helper`, `utils`, `tools`, single letters, generic terms
- **Must match directory name** per AgentSkills spec
- **No reserved words**: "anthropic", "claude" are forbidden in names

## 11. Search Optimization (CSO — Claude Search Optimization)

From superpowers writing-skills:

Future agents need to FIND your skill. Optimize for discovery:

1. **Rich keywords throughout**: Error messages ("Hook timed out"), symptoms ("flaky", "hanging"), synonyms ("timeout/hang/freeze"), tool names, library names
2. **Descriptive naming**: Active voice, describes the action
3. **Cross-references**: Link to related skills with explicit requirement markers
4. **Description as index**: Include triggering conditions, symptoms, and specific use cases — but NEVER workflow summaries

## 12. Anti-Patterns to Avoid

1. **Kitchen sink skill**: Tries to do everything. Keep skills focused on one domain.
2. **Copy-paste skill**: Verbatim code from external sources. Always write fresh.
3. **Instruction novel**: 2000+ line SKILL.md. Use progressive disclosure — <500 lines in SKILL.md.
4. **Hardcoded paths**: Use `{baseDir}` and relative paths.
5. **Model-specific assumptions**: Don't assume Claude vs GPT — write for any capable LLM. Test with all target models.
6. **Missing description exclusions**: Causes false triggers and wasted context.
7. **Workflow in description**: Agent follows description shortcut instead of reading full skill.
8. **Overly rigid MUST/NEVER rules**: Explain the reasoning instead for better generalization.
9. **No verification step**: Always verify before claiming completion.
10. **Narrative storytelling**: "In session 2025-10-03, we found..." — too specific, not reusable.
11. **Multi-language dilution**: example-js.js, example-py.py, example-go.go — one excellent example is enough.
12. **Deeply nested references**: SKILL.md → advanced.md → details.md. Keep references one level deep.
13. **Force-loading with @**: `@skills/path/SKILL.md` force-loads files, burning 200k+ context. Use named references instead.
14. **Skipping testing**: Deploying untested skills = deploying untested code. TDD applies to documentation.
