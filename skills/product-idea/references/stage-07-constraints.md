# Stage 7 — Constraints & Guardrails

## Role

Pragmatic technical advisor defining real-world constraints. This is where reality checks the vision.

## Context Required

Read all prior artifacts (`01` through `06`) before starting.

## Boundaries

- Be honest about constraints — they shape everything downstream.
- No aspirational answers. "What can you actually spend?" not "what would be ideal?"
- These constraints MUST shape the architecture decisions in Stage 8.

## Conversation Flow

1. **Budget constraints**: What's the development budget? Monthly operational budget ceiling? What third-party services are you willing to pay for? What's the "oh shit" threshold where costs are too high?
2. **Time constraints**: When does MVP need to ship? Hard deadline or flexible? What happens if you miss it? Phase 2 timeline?
3. **Preferred tech stack**: Any preferences or hard requirements? Languages, frameworks? What does the builder already know well? (Using familiar tools > theoretically optimal tools for solo builders.)
4. **Hosting assumptions**: Cloud provider preference? Serverless vs containers vs traditional? Monthly hosting budget? Edge/CDN needs?
5. **AI-assisted development**: Will AI agents build this? What models/tools (Codex, Claude Code, Gemini)? What's the human oversight level? What parts require human review before shipping?
6. **Maintenance expectations**: Who maintains this after launch? How many hours/week for maintenance? Is there an on-call expectation? What's the update cadence?
7. **Team composition**: Solo builder? Small team? What skills are available? What skills are missing? Is hiring planned?
8. **Distribution**: How do users get the product? Web app? App store? Package manager? What's the install/onboarding friction budget?

### Reality Checks

For each constraint, cross-reference against NFRs from Stage 6:
- Can the stated uptime target be achieved with this budget and team size?
- Can the performance targets be hit with the hosting budget?
- Does the scaling plan match the team's ability to respond to growth?

If constraints conflict with NFRs, surface the conflict immediately and force a resolution.

## Output Artifact: `07-constraints.md`

```markdown
# Constraints & Assumptions — [Product Name]

## Budget
- Development: [amount or range — "zero" is valid, state it]
- Monthly operations ceiling: [$X/month max — hard limit]
- Third-party services budget: [what you'll pay for vs. self-host]
- "Oh shit" threshold: [monthly cost that triggers alarm]

## Timeline
- MVP target: [specific date or "X weeks from start"]
- Hard or soft deadline: [what happens if missed]
- Phase 2 target: [date or "X weeks after MVP launch"]

## Tech Stack
- **Preferred/known**: [what the builder is already skilled in]
- **Hard requirements**: [non-negotiable tech choices and why]
- **Open to**: [areas where the best tool should be chosen regardless of familiarity]

## Hosting & Infrastructure
- Cloud provider: [choice + reasoning]
- Deployment model: [serverless / containers / PaaS / traditional]
- Monthly hosting budget: [$X target]
- CDN/edge needs: [yes/no + reasoning]

## AI-Assisted Development
- Primary coding agent: [Codex / Claude Code / other]
- Human oversight model: [what gets human review vs. auto-shipped]
- AI cost model: [subscription tiers being used]

## Maintenance
- Maintainer: [who — solo builder, team, outsourced]
- Hours/week budget: [realistic maintenance time]
- Update cadence: [weekly / biweekly / monthly / as-needed]
- On-call: [yes/no — if no, what's the max acceptable downtime?]

## Team
- Size: [N people, roles]
- Skill strengths: [what the team is great at]
- Skill gaps: [what's missing — be honest]
- Hiring plans: [if any]

## Distribution
- Delivery method: [web app / PWA / native / package / other]
- App store: [if yes, which stores — review timeline implications]
- Install friction budget: [how many steps from "heard about it" to "using it"]

## Constraint-NFR Conflicts
[List any conflicts between these constraints and Stage 6 NFRs. For each: what's the conflict, which side gives, and what's the resolution.]
```

## Quality Gates

- [ ] Budget is stated as a number or range, not "affordable"
- [ ] Timeline has specific dates or durations
- [ ] Tech preferences distinguish "comfortable with" from "non-negotiable"
- [ ] Constraint-NFR conflicts section is populated (or explicitly "none found")
- [ ] AI-assisted development section reflects actual tooling plan
- [ ] Maintenance budget is realistic for the stated team size
