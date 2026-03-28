# Stage 5 — Feature Definition & User Stories

## Role

Product strategist defining features without discussing technology.

## Context Required

Read all prior artifacts (`01` through `04`) before starting.

## Boundaries

- Features only — no tech stack, no architecture.
- Every feature must trace back to a persona need or journey step.
- Be ruthless about MVP scope — the narrowest wedge from Stage 3 is your guide.

## Conversation Flow

1. Start from the narrowest wedge (Stage 3) — what's the minimum set to deliver the first value moment from Stage 4?
2. For each proposed feature, challenge: "Does this need to exist in MVP? What happens if we ship without it?"
3. Define **explicit exclusions** — things this product deliberately does NOT do in v1. Be specific about why.
4. Set **scope boundaries** — where does this product end and other tools begin?
5. For each feature, push for clear acceptance criteria — not "it works well" but specific testable conditions.

### AI Slop Detection

Challenge any feature description that sounds generic:
- "Dashboard with widgets" → what makes this NOT every other dashboard?
- "Clean, modern UI" → meaningless. What specific design decisions?
- "Intuitive onboarding" → what specific steps, in what order, with what data?
- "Social features" → which social features? Sharing? Comments? Profiles? Be precise.

## Output Artifact: `05-features.md`

```markdown
# Feature Inventory & User Stories — [Product Name]

## MVP Features (Narrowest Wedge)

### [Feature Name]
- **Description**: [What it does — specific, not vague]
- **User Story**: As a [persona], I want [specific action], so that [specific outcome].
- **Traces to**: [Which persona need + which journey step]
- **Acceptance Criteria**:
  - [ ] [Specific, testable criterion with numbers where possible]
  - [ ] [Another criterion]
- **Interaction States**: Loading: [X] | Empty: [X] | Error: [X] | Success: [X]

[Repeat for each MVP feature]

## Phase 2 Features

### [Feature Name]
- **Description**: [What it does]
- **User Story**: As a [persona], I want [action], so that [outcome].
- **Rationale for deferral**: [Specific reason — not "nice to have" but why it doesn't block the wedge]
- **Depends on**: [Which MVP feature must exist first]

## Explicitly Not Included (with reasons)

| Feature/Capability | Why Excluded | When to Reconsider |
|-------------------|-------------|-------------------|
| [feature] | [specific reason] | [trigger condition] |

## Scope Boundaries

- [Where this product ends and other tools/manual processes begin]
- [What the product is NOT trying to be]

## Feature-Persona Traceability Matrix

| Feature | Persona 1 Need | Persona 2 Need | Journey Step |
|---------|---------------|---------------|--------------|
| [feature] | [need or —] | [need or —] | [step #] |
```

## Multi-Model Audit Trigger

After this stage, trigger a multi-model audit:
- Spawn Codex sub-agent: review features against personas and journeys for gaps and contradictions.
- Spawn Gemini sub-agent: independent feature review — are there obvious features missing? Scope creep?
- Produce consensus table and present to user before finalizing.

Review prompts should include:
1. Does every MVP feature trace to a persona need AND a journey step?
2. Is the MVP genuinely minimal — could any feature be deferred?
3. Are there features implied by the journeys that aren't listed?
4. Do any acceptance criteria conflict with each other?
5. Are interaction states defined for every user-facing feature?

## Quality Gates

- [ ] Every MVP feature traces to a persona need AND a journey step (traceability matrix complete)
- [ ] Acceptance criteria are testable with specific numbers (not "works well")
- [ ] Exclusions are explicit, reasoned, and include reconsideration triggers
- [ ] MVP is genuinely the narrowest wedge — challenge every feature's inclusion
- [ ] Interaction states (loading/empty/error/success) defined for every user-facing feature
- [ ] No AI slop: every feature description is specific to THIS product, not generic
- [ ] Multi-model audit completed and findings incorporated
