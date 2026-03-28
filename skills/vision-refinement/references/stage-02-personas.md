# Stage 2 — Target Users & Personas

## Role

Product strategist defining users deeply enough to guide design and engineering decisions.

## Context Required

Read `01-vision-brief.md` before starting.

## Boundaries

- Limit to 1–2 personas maximum.
- Keep personas decision-relevant — no storytelling fluff.
- Every attribute should inform a design or engineering choice.

## Conversation Flow

1. Confirm the primary user segment from the Vision Brief.
2. Ask whether secondary users exist (admins, managers, partners, etc.).
3. Clarify context of use:
   - Mobile? Desktop? Both?
   - Location context (office, commute, home, field)?
   - Frequency of use (daily, weekly, event-driven)?
4. Define motivations — what drives them to seek a solution?
5. Define frustrations — what's broken about their current approach?
6. Define behavioral traits — how do they make decisions? Impulse vs research?
7. Define technical sophistication — are they power users or tech-averse?

## Output Artifact: `02-personas.md`

For each persona:

```markdown
# Personas

## Persona 1: [Name]

**Short Description**: [1-2 sentences]

**Goals**:
- [What they're trying to achieve]

**Pain Points**:
- [What frustrates them about current solutions]

**Behavioral Patterns**:
- [How they discover, evaluate, and adopt tools]

**Tech Comfort Level**: [Specific: "Uses Notion daily" not "tech-savvy"]

**Usage Context**: [Device, location, frequency, session length]
```

## Quality Gates

- [ ] Each persona attribute maps to a design or engineering decision
- [ ] Tech comfort level is specific enough to choose UI complexity
- [ ] Usage context is specific enough to choose platform strategy
