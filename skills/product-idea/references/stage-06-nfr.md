# Stage 6 — Non-Functional Requirements

## Role

Systems thinker defining operational expectations with measurable targets.

## Context Required

Read all prior artifacts (`01` through `05`) before starting.

## Boundaries

- No vague language. "Fast" and "secure" are not requirements.
- Every requirement must have a number, standard, or clear threshold.
- Calibrate targets to the constraints (solo builder ≠ Google-scale requirements).

## Conversation Flow

Force clarity on each dimension. For each, push until there's a measurable target:

1. **Performance**: What response times are acceptable? Page load target? API latency? Under what concurrent load? Be realistic: "< 2s page load at 100 concurrent users" not "fast."
2. **Availability**: What uptime is expected? Is 99.9% realistic for a solo builder? What happens during downtime — is a maintenance page acceptable?
3. **Security**: Authentication method? Data encryption at rest and in transit? Input validation strategy? OWASP Top 10 compliance? For each new user input: what's the validation, sanitization, and rejection behavior?
4. **Privacy**: What data is collected? Where stored? Jurisdiction? GDPR/CCPA relevance? Data deletion policy? What's the data lifecycle: created → updated → archived → deleted?
5. **Scalability**: Expected user count at launch? 6 months? 2 years? What's the scaling trigger — at what threshold do you need to re-architect? What breaks first under 10x load?
6. **Compliance**: Industry-specific regulations? Age restrictions? Financial compliance? Accessibility (WCAG level)?
7. **Observability**: Logging strategy? Monitoring? Alerting? Error tracking? "If a bug is reported 3 weeks post-ship, can you reconstruct what happened from logs alone?"
8. **Accessibility**: WCAG level? Screen reader support? Keyboard navigation? Touch targets (44px min)? Color contrast requirements?

## Output Artifact: `06-nfr.md`

```markdown
# Non-Functional Requirements — [Product Name]

## Performance
- Page load: [target, e.g., < 2s at p95]
- API response: [target, e.g., < 500ms at p95]
- Concurrent users: [target for launch, 6mo, 2yr]
- What breaks first at 10x: [specific bottleneck]

## Availability
- Uptime target: [e.g., 99.5% — realistic for team size]
- Maintenance windows: [when, how communicated]
- Degradation strategy: [what degrades gracefully vs. hard fails]

## Security
- Authentication: [specific strategy — magic links, OAuth, email+password]
- Authorization: [RBAC, per-resource, etc.]
- Data encryption: [at rest, in transit — specific standards]
- Input validation: [strategy for each input type]
- Vulnerability management: [scanning, dependency updates, disclosure policy]

## Privacy
- Data collected: [explicit list]
- Storage jurisdiction: [where, why]
- Regulatory requirements: [GDPR, CCPA, or "none applicable" with reasoning]
- Data lifecycle: [created → retained how long → archived/deleted when]
- User data deletion: [process, timeline]

## Scalability
- Launch: [expected users, data volume]
- 6 months: [projection]
- 2 years: [projection]
- Scaling trigger: [at what threshold re-architecture needed]
- First bottleneck: [what breaks first]

## Observability
- Logging: [structured? What's logged at each level?]
- Monitoring: [uptime, performance, business metrics]
- Alerting: [what triggers alerts, who receives them]
- Error tracking: [tool, strategy]
- Debuggability: [can you reconstruct a bug report from logs alone?]

## Accessibility
- WCAG level: [A, AA, or AAA — with reasoning]
- Keyboard navigation: [full, partial, or N/A]
- Screen reader support: [ARIA landmarks, roles]
- Touch targets: [minimum size]
- Color contrast: [ratio target]
```

## Quality Gates

- [ ] Every requirement has a number, standard, or clear threshold
- [ ] No vague adjectives remain ("fast", "secure", "scalable")
- [ ] Privacy section addresses full data lifecycle
- [ ] Targets are calibrated to team size and budget (don't spec Google-scale for a solo builder)
- [ ] Accessibility requirements are specific (WCAG level, not "accessible")
- [ ] Observability includes the "3 weeks later" debuggability test
