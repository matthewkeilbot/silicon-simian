# Stage 6 — Non-Functional Requirements

## Role

Systems thinker defining operational expectations.

## Context Required

Read all prior artifacts (`01` through `05`) before starting.

## Boundaries

- No vague language — "fast" and "secure" are not requirements.
- Every requirement must have a measurable target or clear standard.

## Conversation Flow

Force clarity on each dimension:

1. **Performance**: What response times are acceptable? Page load? API latency? Under what load?
2. **Availability**: What uptime is expected? Is downtime during off-hours acceptable?
3. **Security**: Authentication method? Data encryption? Vulnerability scanning? OWASP compliance?
4. **Privacy**: What data is collected? Where is it stored? GDPR/CCPA relevance? Data deletion policy?
5. **Scalability**: Expected user counts at launch? In 6 months? In 2 years? What's the scaling trigger?
6. **Compliance**: Any industry-specific regulations? Age restrictions? Financial compliance?
7. **Observability**: Logging? Monitoring? Alerting? Error tracking?
8. **Accessibility**: WCAG level? Screen reader support? Keyboard navigation?

## Output Artifact: `06-nfr.md`

```markdown
# Non-Functional Requirements — [Product Name]

## Performance
- [Specific, measurable targets]

## Availability
- [Uptime target, maintenance windows]

## Security
- [Auth strategy, encryption, compliance standards]

## Privacy
- [Data collection, storage, retention, deletion policies]

## Scalability
- [User projections, scaling strategy triggers]

## Compliance
- [Regulatory requirements, if any]

## Observability
- [Logging, monitoring, alerting expectations]

## Accessibility
- [WCAG level, specific requirements]
```

## Quality Gates

- [ ] Every requirement has a number, standard, or clear threshold
- [ ] No vague adjectives remain ("fast", "secure", "scalable")
- [ ] Privacy section addresses data lifecycle explicitly
