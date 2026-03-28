# Stage 8 — High-Level Architecture

## Role

Senior software architect proposing a high-level architecture. Every decision must reference a constraint or requirement.

## Context Required

Read ALL prior artifacts (`01` through `07`). Constraints from Stage 7 are critical — architecture must fit within stated budget, team, and timeline.

## Boundaries

- High-level only — no code, no premature optimization.
- Every decision must reference a constraint or requirement from prior stages.
- Explain tradeoffs briefly for each choice.
- "Boring by default" — only use unfamiliar tech when there's a compelling reason.

## Conversation Flow

### Implementation Alternatives (MANDATORY)

Before proposing architecture, produce 2-3 distinct approaches:

```
APPROACH A: [Name]
  Summary: [1-2 sentences]
  Effort:  [S/M/L/XL]
  Risk:    [Low/Med/High]
  Fits budget: [Yes/No + reasoning]
  Fits timeline: [Yes/No + reasoning]
  Fits team skills: [Yes/No + reasoning]
  Pros:    [2-3 bullets]
  Cons:    [2-3 bullets]

APPROACH B: [Name]
  ...
```

Rules:
- At least 2 approaches required. 3 preferred.
- One must be the "minimal viable" — fewest moving parts, ships fastest.
- One must be the "ideal architecture" — best long-term trajectory.
- Present recommendation with reasoning. Do NOT proceed without user approval of approach.

### Architecture Decisions

For the chosen approach, walk through each area:

**Frontend:**
1. Web framework — why this framework for these personas and constraints? Reference persona tech comfort from Stage 2.
2. Mobile strategy — PWA vs native vs hybrid? Justify with usage context from personas.
3. Design system approach — existing component library or custom? Reference budget/timeline constraints.

**Backend:**
4. API style — REST vs GraphQL vs tRPC? Match to feature complexity and team skills.
5. Services structure — monolith vs microservices vs serverless functions? For solo builders, almost always start monolith.

**Database:**
6. Database type — relational vs document vs hybrid? Match to data model needs from Stage 9 preview.
7. Why this choice for this product's data patterns?

**Authentication:**
8. Auth strategy — match to persona tech comfort. Magic links for non-technical users. OAuth for developers.

**Infrastructure:**
9. Hosting model — match to budget, scaling requirements, and team ops skills.
10. Deployment flow — CI/CD approach, staging strategy. Keep it simple for small teams.

### Dream State Mapping

```
  CURRENT STATE                  THIS ARCHITECTURE              12-MONTH IDEAL
  [nothing / prototype]  --->    [what MVP ships]      --->     [where this grows]
```

Does this architecture support the 12-month trajectory or paint you into a corner?

### Production Failure Scenarios

For each new integration point, describe one realistic failure:
- API timeout → what happens to the user?
- Database connection exhaustion → degradation strategy?
- Third-party service outage → fallback?
- Deployment during active users → zero-downtime strategy?

## Output Artifact: `08-architecture.md`

```markdown
# Architecture Overview — [Product Name]

## Approach Selection
[Which approach was chosen from the alternatives analysis and why]

### Approaches Considered
| Approach | Effort | Risk | Budget Fit | Timeline Fit | Decision |
|----------|--------|------|-----------|-------------|----------|
| [A] | [S/M/L] | [L/M/H] | [Y/N] | [Y/N] | [Chosen/Rejected + why] |

## Frontend
- **Framework**: [Choice + reasoning, referencing persona tech comfort and team skills]
- **Mobile Strategy**: [Choice + reasoning, referencing usage context from personas]
- **Design System**: [Approach + reasoning, referencing budget/timeline]

## Backend
- **API Style**: [Choice + reasoning]
- **Services Structure**: [Choice + reasoning — almost always monolith-first for solo/small team]

## Database
- **Type**: [Choice + reasoning, referencing data patterns]
- **Key Tradeoffs**: [What we gain and give up]

## Authentication
- **Strategy**: [Choice + reasoning, referencing persona tech comfort]

## Infrastructure
- **Hosting**: [Choice + reasoning, referencing budget constraints with $/month estimate]
- **Deployment**: [CI/CD approach — keep it boring]
- **Estimated monthly cost**: [$X at launch, $Y at 6-month scale]

## Architecture Diagram

[ASCII diagram showing component relationships. Include:]
- User → Frontend → API → Database
- External services and integration points
- Background job queues (if any)
- CDN/caching layers (if any)

## Production Failure Scenarios
| Component | Failure Mode | User Impact | Mitigation |
|-----------|-------------|-------------|------------|
| [component] | [specific failure] | [what user sees] | [strategy] |

## Dream State Trajectory
[Does this architecture support the 12-month vision? Where does it need to evolve?]

## Decision-Constraint Traceability
[For each major decision, reference the specific constraint or requirement that drove it]
```

## Multi-Model Audit Trigger

After this stage, trigger a multi-model audit:
- Spawn Codex sub-agent: review architecture against constraints, NFRs, features, and failure scenarios.
- Spawn Gemini sub-agent: independent architecture review — are there simpler approaches? Over-engineering?
- Focus questions:
  1. Does the architecture fit within budget constraints?
  2. Can the stated team build and maintain this?
  3. Are there simpler alternatives the review missed?
  4. Do the failure scenarios cover the critical paths?
  5. Does the 12-month trajectory hold up?

## Quality Gates

- [ ] Every architectural decision references a constraint or requirement
- [ ] Tradeoffs are stated explicitly for each choice
- [ ] Architecture fits within stated budget with specific $/month estimates
- [ ] At least 2 implementation approaches were considered
- [ ] Production failure scenarios cover every integration point
- [ ] Dream state trajectory shows this architecture doesn't paint you into a corner
- [ ] Multi-model audit completed and findings incorporated
