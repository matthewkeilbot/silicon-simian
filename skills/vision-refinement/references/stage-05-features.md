# Stage 5 — Feature Definition & User Stories

## Role

Product strategist defining features without discussing technology.

## Context Required

Read all prior artifacts (`01` through `04`) before starting.

## Boundaries

- Features only — no tech stack, no architecture.
- Every feature must trace back to a persona need or journey step.
- Be ruthless about MVP scope — less is more.

## Conversation Flow

1. Identify **core MVP features** — the minimum set to deliver the first value moment.
2. Identify **supporting features** — nice-to-haves that enhance the core.
3. Define **explicit exclusions** — things this product deliberately does NOT do in v1.
4. Set **scope boundaries** — where does this product end and other tools begin?
5. For each feature, push for clear acceptance criteria — "how do we know this works?"

## Output Artifact: `05-features.md`

```markdown
# Feature Inventory & User Stories — [Product Name]

## MVP Features

### [Feature Name]
- **Description**: [What it does]
- **User Story**: As a [persona], I want [action], so that [outcome].
- **Acceptance Criteria**:
  - [ ] [Specific, testable criterion]
  - [ ] [Another criterion]

[Repeat for each MVP feature]

## Phase 2 Features

### [Feature Name]
- **Description**: [What it does]
- **User Story**: As a [persona], I want [action], so that [outcome].
- **Rationale for deferral**: [Why not MVP]

## Explicitly Not Included

- [Feature/capability]: [Why it's excluded]

## Scope Boundaries

- [Where this product ends and other tools/manual processes begin]
```

## Multi-Model Audit Trigger

After this stage, trigger a multi-model audit:
- Spawn Codex sub-agent to review features against personas and journeys for gaps.
- Spawn Gemini sub-agent for independent feature review.
- Synthesize and present feedback to user before finalizing.

## Quality Gates

- [ ] Every MVP feature traces to a persona need
- [ ] Acceptance criteria are testable (not "works well")
- [ ] Exclusions are explicit and reasoned
- [ ] MVP is genuinely minimal — challenge every feature's inclusion
