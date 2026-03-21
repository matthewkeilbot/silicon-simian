# Documentation Process — Measuring Agent Effectiveness

## Purpose

Instrument the agent team so the CEO (MEK) and Director (Matthew) can gauge performance, identify bottlenecks, and make data-driven improvement decisions. Documentation is not bureaucracy — it's the organization's eyes and ears.

## What Gets Measured

### 1. Task Completion Metrics

Every task assigned to a C-level agent produces a **task record**:

```markdown
## Task: [ID] [Title]
- **Assigned:** [timestamp]
- **Completed:** [timestamp]
- **Duration:** [elapsed]
- **Status:** completed | failed | escalated | cancelled
- **Assignee:** CTO | PA | Mechanic
- **Sub-agents spawned:** [count]
- **Outcome:** [brief result description]
- **Quality:** [CEO assessment: excellent | good | acceptable | poor]
- **Issues:** [any problems encountered]
```

Task records are appended to `specs/agent-team/logs/task-log.md` by the CEO after each significant task completion.

### 2. Agent Status Files

Each C-level maintains their own `status.md` in their workspace subdirectory:

```markdown
# [Agent] Status

## Active Tasks
- [task description] — [status] — [ETA]

## Completed (last 7 days)
- [task] — [outcome] — [duration]

## Blocked
- [issue] — [what's needed to unblock]

## Observations
- [lessons learned, patterns noticed, improvement ideas]
```

### 3. Incident Reports

When something goes wrong (bug introduced, task failed, wrong output), the responsible agent writes an incident report:

```markdown
## Incident: [title]
- **Date:** [timestamp]
- **Severity:** critical | high | medium | low
- **Agent:** [who]
- **What happened:** [description]
- **Root cause:** [analysis]
- **Resolution:** [what was done]
- **Prevention:** [how to avoid in future]
- **Duration:** [time to resolve]
```

Incidents go to `specs/agent-team/logs/incidents.md`.

### 4. Decision Records

For significant technical or process decisions:

```markdown
## Decision: [title]
- **Date:** [timestamp]
- **Decided by:** [CEO | CTO | etc.]
- **Context:** [why this decision was needed]
- **Options considered:** [list]
- **Decision:** [what was chosen]
- **Rationale:** [why]
- **Consequences:** [expected outcomes]
```

Decisions go to `specs/agent-team/logs/decisions.md`.

## Review Cadence

### Daily (during heartbeats)
- CEO scans C-level status files for blockers
- Check for unresolved incidents
- Verify task progress against expectations

### Weekly (CEO-initiated)
- Review task-log.md for completion rates and quality trends
- Identify agents that are consistently slow, blocked, or producing poor quality
- Check if skill gaps are emerging (tasks that repeatedly fail or need escalation)
- Update improvement backlog

### Monthly (CEO reflection)
- Aggregate metrics: tasks completed, average quality, incidents, escalations
- Compare agent performance month-over-month
- Review and update agent definitions if roles have drifted
- Review and improve skills based on real-world usage patterns

## Instrumentation Rules

1. **The CEO documents, agents report** — C-levels report status; the CEO records evaluations. The Director reviews when needed. This prevents self-grading bias.
2. **Lightweight over thorough** — A one-line task log entry is better than no entry. Don't let documentation become a bottleneck.
3. **Honest assessments** — "Poor" quality is a useful signal, not a punishment. Track it.
4. **Patterns over incidents** — One failure is noise. Three failures in the same area is a signal that needs action.
5. **Time-bound** — Old logs (>30 days) can be archived. Keep the active files lean.

## File Locations

```
specs/agent-team/
├── logs/
│   ├── task-log.md        # All task records
│   ├── incidents.md       # Incident reports
│   ├── decisions.md       # Decision records
│   └── archive/           # Archived old logs
├── metrics/
│   └── weekly-summary.md  # Weekly metric summaries
```
