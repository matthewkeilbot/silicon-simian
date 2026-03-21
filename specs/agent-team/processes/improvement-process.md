# Improvement Process — Continuous Agent Development

## Philosophy

Borrowed from Matthew's core value: **constant improvement is non-negotiable.** Every agent gets better over time. The CEO's job is to create the feedback loops that make this happen.

## The Improvement Loop

```
Observe → Diagnose → Hypothesize → Implement → Measure → Repeat
```

### 1. Observe

**Sources of signal:**
- Task quality assessments (from task-log.md)
- Incident frequency and patterns (from incidents.md)
- Agent self-reported observations (from status.md)
- CEO direct experience working with each agent
- Sub-agent output quality (does the C-level's team produce good work?)

**Red flags to watch for:**
- Same type of failure repeating across tasks
- Agent asking CEO questions it should be able to answer itself
- Tasks taking significantly longer than expected
- Sub-agents being spawned unnecessarily (cost waste)
- Output that needs heavy CEO editing before it's usable
- Agent ignoring its own skills/guidelines

### 2. Diagnose

When a pattern emerges, the CEO investigates:

**Skill gap?** → The agent doesn't have the right skills for the task type.
- Fix: Create or adapt a skill that covers the gap.

**Instruction gap?** → The agent markdown is ambiguous or missing guidance for this situation.
- Fix: Update the agent definition with clearer instructions.

**Model mismatch?** → The model assigned isn't capable enough (or is overkill).
- Fix: Adjust model assignment.

**Context deficit?** → The agent doesn't have enough context to make good decisions.
- Fix: Improve the task brief template or add reference materials.

**Process gap?** → The workflow itself has a hole.
- Fix: Update the relevant process doc or add a new guardrail.

**Tool deficit?** → The agent needs access to a tool it doesn't have.
- Fix: Install or build the needed skill/tool.

### 3. Hypothesize

Before changing anything, write down:

1. **What's the problem?** (specific, with evidence)
2. **What do I think will fix it?** (concrete change)
3. **How will I know it worked?** (measurable outcome)

This goes in the improvement backlog: `specs/agent-team/logs/improvement-backlog.md`

```markdown
## Improvement: [title]
- **Date identified:** [timestamp]
- **Agent:** [who]
- **Problem:** [specific issue with evidence]
- **Proposed fix:** [what to change]
- **Success criteria:** [how to measure improvement]
- **Status:** proposed | in-progress | implemented | measured | closed
- **Outcome:** [result after measurement]
```

### 4. Implement

Make the change. This could be:

- **Agent markdown update** — Edit `specs/agent-team/agents/[AGENT].md` and the corresponding skill/session config
- **Skill creation/modification** — Use the skill-development workflow
- **Process update** — Edit process docs
- **Model change** — Adjust model assignments in architecture.md
- **Guardrail addition** — Add a new rule to the agent's guardrails

### 5. Measure

After implementation, actively track whether the fix worked:

- Assign tasks specifically designed to test the improvement area
- Compare output quality before/after
- Check if the red flag pattern stops recurring
- Note any unintended side effects

Record results in the improvement backlog entry.

### 6. Close or Iterate

If the improvement worked: close the backlog entry with outcome notes.
If it didn't: diagnose again with new data and try a different approach.

## Skill Improvement Specifically

Skills are the most impactful lever. When improving skills:

1. **Start with the anthropic skill-creator methodology** — Use the eval + iterate + review loop
2. **Test with real tasks** — Don't optimize in a vacuum; use actual work as test cases
3. **Get external review** — Use Codex 5.4 and Gemini 3.1 Pro as reviewers for skill content
4. **Watch transcripts** — Read how the agent actually uses the skill, not just the output
5. **Generalize from failures** — One bad output might mean a specific fix, but three bad outputs means the skill needs rethinking

## Agent Markdown Refinement

The agent definition files are living documents. Refinement triggers:

- Agent consistently misunderstands task scope → Clarify responsibilities section
- Agent skips guardrails → Make guardrails more prominent, add anti-patterns
- Agent spawns wrong sub-agent types → Clarify sub-agent team section
- Agent reporting format is unhelpful → Improve communication protocol templates
- New responsibility emerges → Add to responsibilities, possibly add skills

## Cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Check for red flags | Daily (heartbeat) | CEO |
| Update improvement backlog | As needed | CEO |
| Implement improvements | Weekly (batch small fixes) | CEO |
| Skill reviews | Bi-weekly | CEO + external model review |
| Full agent assessment | Monthly | CEO |
| Architecture review | Quarterly | CEO + CTO + Director |

## External Review Process

For major changes (new agents, significant skill rewrites, architecture changes):

1. Draft the change
2. Send to Codex 5.4 for review (focus: technical correctness, completeness)
3. Incorporate feedback
4. Send to Gemini 3.1 Pro for review (focus: fresh perspective, missed gaps)
5. Incorporate feedback
6. Final CEO review and implementation

This dual-model review process catches blind spots that single-model review misses.

## File Locations

```
specs/agent-team/
├── logs/
│   ├── improvement-backlog.md   # All improvement proposals and outcomes
│   └── skill-reviews/           # Skill review records
```
