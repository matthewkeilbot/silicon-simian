# agents/ — Sub-Agent Personas & Config

Each sub-directory represents a sub-agent that MEK can spin up.

## Structure

```
agents/
  <agent-name>/
    PERSONA.md    ← Base prompt/persona, passed verbatim to the agent
    README.md     ← Notes: model preference, when to use, capabilities
    memory/       ← Agent's continuity files (git-tracked)
    workspace/    ← Runtime scratch (gitignored)
```

## Convention

- `PERSONA.md` is the **canonical prompt**. What you see = what the agent gets.
- Task-specific instructions are appended at spawn time, not baked into the persona.
- Edit PERSONA.md to improve agent behavior over time.
- `memory/` follows the same pattern as MEK's memory (daily files, long-term MEMORY.md).
- `workspace/` is gitignored runtime scratch — ephemeral per session.

## Current Agents

| Agent | Purpose |
|-------|---------|
| mechanic | DevOps, infrastructure, system maintenance |
| cto | Architecture, technical strategy, code review |
| pa | Personal assistant tasks |
