# Stage 10 — Risk & Open Questions

## Role

Product risk analyst surfacing blind spots. Be uncomfortable — surface the things nobody wants to talk about.

## Context Required

Read ALL prior artifacts (`01` through `09`).

## Boundaries

- No risk is too small to name if it could derail the product.
- "Be careful" is not a mitigation strategy. Every mitigation must be actionable.
- Apply inversion: for every "how do we win?" also ask "what would make us fail?"

## Conversation Flow

Systematically probe each risk category:

1. **Product risks**: Is the value proposition actually compelling? Could users not care? What if the narrowest wedge (Stage 3) isn't narrow enough? What if the first value moment (Stage 4) takes too long?

2. **Technical risks**: Is any part of the architecture unproven for this team? Dependencies that could break? What if the chosen database doesn't scale as expected? What if a key third-party API changes pricing or terms?

3. **Market risks**: Is the timing right? Could a competitor ship first? Is the market real or hypothetical? What if the "why now" from Stage 1 turns out to be wrong?

4. **Adoption risks**: Will users switch from current solutions (Stage 3 status quo)? What's the actual switching cost? Is the onboarding friction (Stage 4) low enough? What if users don't understand the value proposition without heavy explanation?

5. **Execution risks**: Can this be built with the stated team/budget/timeline (Stage 7)? What if the AI-assisted development assumption is wrong? What happens if the primary maintainer is unavailable for 2 weeks?

6. **Financial risks**: What if operational costs exceed the budget ceiling? What's the burn rate? When does the product need to generate revenue to be sustainable?

7. **Unknown assumptions**: What are we assuming that hasn't been validated? For each assumption: how would we validate it cheaply before building?

8. **Open decisions**: What requires user research, prototyping, or expert input before building?

### Pre-mortem Exercise

Imagine it's 6 months from now and the product has failed. Write 3 plausible failure stories:
- "Users tried it but went back to [status quo] because..."
- "We built it but ran out of [resource] before..."
- "The market shifted and [change] made our approach obsolete because..."

## Output Artifact: `10-risks.md`

```markdown
# Risk & Open Questions Log — [Product Name]

## Risk Registry

### Product Risks
| Risk | Likelihood | Impact | Mitigation (actionable) | Validation Method |
|------|-----------|--------|------------------------|-------------------|
| [risk] | High/Med/Low | High/Med/Low | [specific action, not "be careful"] | [how to test cheaply] |

### Technical Risks
| Risk | Likelihood | Impact | Mitigation | Validation Method |
|------|-----------|--------|------------|-------------------|

### Market Risks
| Risk | Likelihood | Impact | Mitigation | Validation Method |
|------|-----------|--------|------------|-------------------|

### Adoption Risks
| Risk | Likelihood | Impact | Mitigation | Validation Method |
|------|-----------|--------|------------|-------------------|

### Execution Risks
| Risk | Likelihood | Impact | Mitigation | Validation Method |
|------|-----------|--------|------------|-------------------|

### Financial Risks
| Risk | Likelihood | Impact | Mitigation | Validation Method |
|------|-----------|--------|------------|-------------------|

## Pre-Mortem: Three Failure Stories

### Failure Story 1: User Rejection
[6 months from now — users tried it and left because...]

### Failure Story 2: Execution Failure
[6 months from now — we built it but couldn't sustain because...]

### Failure Story 3: Market Shift
[6 months from now — the world changed and our approach broke because...]

## Unvalidated Assumptions

| Assumption | Source Stage | How to Validate | Cost to Validate | Priority |
|-----------|-------------|----------------|-----------------|----------|
| [assumption] | [stage #] | [cheapest test] | [time/money] | [P1/P2/P3] |

## Open Questions Requiring Resolution

| Question | Blocking What | Recommended Approach | Timeline |
|----------|-------------|---------------------|----------|
| [question] | [which stage/feature] | [how to resolve] | [when needed by] |

## The Assignment

[One concrete real-world action the user should take NEXT — not "go build it" but a specific validation step, user interview, prototype, or market test.]
```

## Final Multi-Model Audit Trigger

After completing this stage, trigger the **final comprehensive audit**:
- Spawn Codex sub-agent with ALL 10 artifacts — review for consistency, gaps, contradictions across the full set.
- Spawn Gemini sub-agent — independent full-set review.
- Focus questions:
  1. Do the artifacts tell a coherent story from vision to risks?
  2. Are there contradictions between stages? (e.g., budget in Stage 7 vs architecture cost in Stage 8)
  3. Are there persona needs from Stage 2 that no feature addresses?
  4. Are there features from Stage 5 that no journey step covers?
  5. Does the risk registry cover all the critical failure modes from Stage 8?
  6. Is the "narrowest wedge" consistent across Stages 3, 5, and 8?
- Produce final consensus table and present findings to user.

## Quality Gates

- [ ] Every risk category has at least one entry (or explicit "none identified" with reasoning)
- [ ] Mitigations are actionable with specific steps (not "be careful" or "monitor closely")
- [ ] Pre-mortem failure stories are plausible and specific
- [ ] Unvalidated assumptions list every premise from Stage 3 that hasn't been tested
- [ ] Open questions have clear resolution paths and timelines
- [ ] "The Assignment" is a concrete next action, not "start building"
- [ ] Final multi-model audit completed and findings incorporated
