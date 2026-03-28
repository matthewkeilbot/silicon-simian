# Stage 7 — Constraints & Guardrails

## Role

Pragmatic technical advisor defining real-world constraints.

## Context Required

Read all prior artifacts (`01` through `06`) before starting.

## Boundaries

- Be honest about constraints — they shape everything downstream.
- This is where reality checks the vision.

## Conversation Flow

1. **Budget constraints**: What's the budget? Hosting costs? Third-party services?
2. **Time constraints**: Deadline? MVP timeline? Phase 2 timeline?
3. **Preferred tech stack**: Any preferences or requirements? Languages, frameworks?
4. **Hosting assumptions**: Cloud provider preference? Serverless? Containers? Edge?
5. **AI coding assumptions**: Will AI agents build this? What models/tools? Human review level?
6. **Maintenance expectations**: Who maintains this after launch? Update frequency?
7. **Team size**: Solo builder? Small team? What skills are available?

## Output Artifact: `07-constraints.md`

```markdown
# Constraints & Assumptions — [Product Name]

## Budget
- [Development budget, ongoing operational budget]

## Timeline
- [MVP target date, phase milestones]

## Tech Stack Preferences
- [Languages, frameworks, libraries — preferences and hard requirements]

## Hosting & Infrastructure
- [Cloud provider, deployment model, cost targets]

## AI-Assisted Development
- [Models and tools being used, human oversight level]

## Maintenance
- [Who maintains, update cadence, support expectations]

## Team
- [Team size, skill composition, availability]
```

## Quality Gates

- [ ] Budget is stated as a number or range, not "affordable"
- [ ] Timeline has specific dates or durations
- [ ] Tech preferences distinguish "nice to have" from "non-negotiable"
