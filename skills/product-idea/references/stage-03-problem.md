# Stage 3 — Problem & Value Definition

## Role

Product strategist defining the problem rigorously and challenging premises.

## Context Required

Read `01-vision-brief.md` and `02-personas.md` before starting.

## Boundaries

- No solution design — focus on the problem space.
- Challenge assumptions about why existing solutions fail.
- This stage ends with a PREMISE GATE — explicit user confirmation required.

## Conversation Flow

1. Map current alternatives — what do users do today? List specific tools, workarounds, manual processes. Name them.
2. Why do those alternatives fail? Be specific and evidence-based:
   - Too expensive? How much? Compared to what budget?
   - Too complex? Which step breaks them? Have you watched someone struggle?
   - Missing a key feature? Which one? How do users work around it?
   - Wrong mental model? How does the user think about this differently than the tool assumes?
3. Identify friction points — where exactly does the current workflow break down?
4. Define what must absolutely work on day one — the "must have" vs "nice to have" bar.
5. Define what failure looks like — if this product launches and fails, what went wrong? Be specific: "users tried it once and never came back because X."

### Premise Challenge

Before drafting the artifact, challenge the foundations:

- **Is this the right problem?** Could a different framing yield a dramatically simpler or more impactful solution?
- **What happens if we do nothing?** Is this a real pain point or a hypothetical one?
- **Narrow beats wide, early.** The smallest version someone will pay real money for this week is more valuable than the full platform vision.

## Output Artifact: `03-problem-value.md`

```markdown
# Problem Statement & Value Proposition — [Product Name]

## Market Context
[What exists today? Name specific competitors and alternatives. Include the "do nothing" alternative.]

## Current User Workflow
[Step-by-step: how does the target persona solve this problem today? Where does it break?]

## Core Friction
[Where exactly does the current experience break down? Be specific: step, tool, emotion.]

## Why Existing Solutions Fall Short
| Alternative | What It Does Well | Where It Fails | Evidence |
|-------------|------------------|----------------|----------|
| [tool/workaround] | [strength] | [specific failure] | [how we know] |

## Value Proposition
For [persona] who [specific need], [product] provides [specific benefit] unlike [named alternatives] because [concrete differentiator].

## Narrowest Wedge
[What's the smallest possible version someone would pay real money for — this week, not after the platform is built?]

## Critical Success Conditions
[3-5 concrete, testable conditions. Not "users like it" but "50 users complete onboarding in first week."]

## What Failure Looks Like
[Specific failure scenarios. "Users try it once and don't return because X." "Users prefer the manual workaround because Y."]
```

## Premise Gate

After this artifact is drafted, synthesize premises from Stages 1-3 and present to user:

```
PREMISES (must agree before proceeding):
1. The core problem is [X] — agree/disagree?
2. The target user is [Y], not [broader category] — agree/disagree?
3. The status quo fails because [Z] — agree/disagree?
4. The narrowest wedge is [W] — agree/disagree?
5. Success looks like [V] in 3 months — agree/disagree?
```

If the user disagrees with any premise, revise and re-confirm. Do NOT proceed to Stage 4 until all premises are agreed.

## Quality Gates

- [ ] Current alternatives are named specifically (not "other apps")
- [ ] Failures of alternatives are evidence-based, not assumed
- [ ] Value proposition follows the template and is defensible
- [ ] Narrowest wedge is genuinely minimal — challenge every piece of scope
- [ ] Critical success conditions are testable with specific numbers
- [ ] Premises are confirmed by user before advancing
