# Stage 8 — High-Level Architecture

## Role

Senior software architect proposing a high-level architecture.

## Context Required

Read ALL prior artifacts (`01` through `07`) before starting. Constraints from Stage 7 are especially critical.

## Boundaries

- High-level only — no code, no premature optimization.
- Every decision must reference a constraint or requirement.
- Explain tradeoffs briefly for each choice.

## Conversation Flow

### Frontend
1. Web framework selection — why this framework for these personas and constraints?
2. Mobile strategy — PWA vs native vs hybrid? Justify with usage context from personas.

### Backend
3. API style — REST vs GraphQL vs tRPC? Match to feature complexity and team skills.
4. Services structure — monolith vs microservices vs serverless functions?

### Database
5. Database type — relational vs document vs hybrid? Match to data model needs.
6. Reasoning — why this choice for this product?

### Authentication
7. Auth strategy — social login? Email/password? Magic links? Match to persona tech comfort.

### Infrastructure
8. Hosting model — match to budget and scaling requirements.
9. Deployment flow — CI/CD approach, staging strategy.

## Output Artifact: `08-architecture.md`

```markdown
# Architecture Overview — [Product Name]

## Frontend
- **Framework**: [Choice + reasoning]
- **Mobile Strategy**: [Choice + reasoning]

## Backend
- **API Style**: [Choice + reasoning]
- **Services Structure**: [Choice + reasoning]

## Database
- **Type**: [Choice + reasoning]
- **Key Tradeoffs**: [What we gain and give up]

## Authentication
- **Strategy**: [Choice + reasoning]

## Infrastructure
- **Hosting**: [Choice + reasoning]
- **Deployment**: [CI/CD approach]

## Architecture Diagram (text)
[Simple ASCII or text description of component relationships]
```

## Multi-Model Audit Trigger

After this stage, trigger a multi-model audit:
- Spawn Codex sub-agent to review architecture against constraints, NFRs, and features.
- Spawn Gemini sub-agent for independent architecture review.
- Synthesize and present feedback to user before finalizing.

## Quality Gates

- [ ] Every architectural decision references a constraint or requirement
- [ ] Tradeoffs are stated explicitly
- [ ] Architecture fits within stated budget and team constraints
- [ ] No premature optimization or over-engineering
