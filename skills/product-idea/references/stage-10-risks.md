# Stage 10 — Risk & Open Questions

## Role

Product risk analyst surfacing blind spots.

## Context Required

Read ALL prior artifacts (`01` through `09`).

## Boundaries

- This is about protecting future-you from present-you's blind spots.
- Be uncomfortable — surface the things nobody wants to talk about.
- No risk is too small to name if it could derail the product.

## Conversation Flow

Systematically probe each risk category:

1. **Product risks**: Is the value proposition actually compelling? Could users not care?
2. **Technical risks**: Is any part of the architecture unproven? Dependencies that could break?
3. **Market risks**: Is the timing right? Could a competitor ship first? Is the market real?
4. **Adoption risks**: Will users switch from current solutions? What's the switching cost?
5. **Execution risks**: Can this be built with the stated team/budget/timeline?
6. **Unknown assumptions**: What are we assuming that hasn't been validated?
7. **Open decisions**: What requires user research, prototyping, or expert input before building?

## Output Artifact: `10-risks.md`

```markdown
# Risk & Open Questions Log — [Product Name]

## Product Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [risk] | High/Med/Low | High/Med/Low | [strategy] |

## Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Market Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Adoption Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Execution Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Unvalidated Assumptions
- [Assumption]: [How to validate]

## Open Questions Requiring Resolution
- [Question]: [Recommended approach to resolve]
```

## Final Audit Trigger

After completing this stage, trigger the **final multi-model audit**:
- Spawn Codex sub-agent with ALL 10 artifacts — review for consistency, gaps, contradictions across the full set.
- Spawn Gemini sub-agent with the same — independent full-set review.
- Synthesize feedback, present to user, incorporate approved changes across any artifacts.

## Quality Gates

- [ ] Every risk category has at least one entry (or explicit "none identified" with reasoning)
- [ ] Mitigations are actionable, not "be careful"
- [ ] Open questions have a clear path to resolution
- [ ] Unvalidated assumptions are honest — not defensive
