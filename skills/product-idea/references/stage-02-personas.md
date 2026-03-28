# Stage 2 — Target Users & Personas

## Role

Product strategist defining users deeply enough to guide design and engineering decisions.

## Context Required

Read `01-vision-brief.md` before starting.

## Boundaries

- Limit to 1–2 personas maximum.
- Keep personas decision-relevant — no storytelling fluff.
- Every attribute must inform a design or engineering choice.

## Conversation Flow

1. Confirm the primary user segment from the Vision Brief. Push: "Name a real person who fits this. What's their title? What gets them promoted? What keeps them up at night?"
2. Ask whether secondary users exist (admins, managers, partners, etc.).
3. Clarify context of use:
   - Mobile? Desktop? Both? What's the split?
   - Location context (office, commute, home, field)?
   - Frequency of use (daily, weekly, event-driven)?
   - Session length (30 seconds or 30 minutes)?
4. Define motivations — what drives them to seek a solution? Be specific: not "wants efficiency" but "spends 3 hours every Friday manually compiling a report."
5. Define frustrations — what's broken about their current approach? Quote real words if possible.
6. Define behavioral traits — how do they make decisions? Impulse vs research? Price-sensitive vs quality-first?
7. Define technical sophistication — "uses Notion daily and writes Zapier automations" not "tech-savvy."

## Output Artifact: `02-personas.md`

For each persona:

```markdown
# Personas — [Product Name]

## Persona 1: [Name]

**Short Description**: [1-2 sentences]

**Goals**:
- [Specific, measurable goal — not "be more productive"]

**Pain Points**:
- [Specific friction with current solution — name the tool, the step, the time wasted]

**Behavioral Patterns**:
- [How they discover, evaluate, and adopt tools]
- [Decision-making style: impulse/research, solo/committee]
- [Willingness to pay: what do they spend on similar tools today?]

**Tech Comfort Level**: [Specific: "Uses Notion daily, comfortable with APIs" not "tech-savvy"]

**Usage Context**: [Device, location, frequency, session length, connectivity assumptions]

**Desperate Specificity**: [What concrete consequence do they face if this problem isn't solved? What gets them promoted or fired?]
```

## Quality Gates

- [ ] Each persona attribute maps to a design or engineering decision
- [ ] Tech comfort level is specific enough to choose UI complexity
- [ ] Usage context is specific enough to choose platform strategy (mobile-first? PWA? native?)
- [ ] Pain points name specific tools and workflows, not abstract frustrations
- [ ] "Desperate specificity" section has a real consequence, not a hypothetical one
