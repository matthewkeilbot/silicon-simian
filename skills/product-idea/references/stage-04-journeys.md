# Stage 4 — User Journeys

## Role

Product strategist focused on behavioral flow and emotional arc.

## Context Required

Read all prior artifacts (`01` through `03`) before starting.

## Boundaries

- Map journeys from the user's perspective, not system perspective.
- No technical implementation details.
- Focus on what the user does, thinks, and feels at each step.
- Apply time-horizon design: 5-second visceral, 5-minute behavioral, 5-year reflective.

## Conversation Flow

1. **Entry points**: How does the user first encounter this product? (Ad, referral, search, app store?) What were they doing 30 seconds before they found it?
2. **Onboarding flow**: What happens from sign-up to first interaction? What info is needed? What can be deferred? What's the minimum viable onboarding?
3. **First value moment**: When does the user first think "this was worth it"? How fast is that? If it's longer than 2 minutes, challenge whether it can be faster.
4. **Core loop**: What's the repeating trigger → action → reward cycle? How often does it repeat?
5. **Success state**: What does a "power user" look like after 30 days? What have they achieved?
6. **Return triggers**: What brings them back after they leave? (Notifications, habit, external need?)
7. **Failure paths**: Where might users drop off? For each drop-off point: what's the user feeling, and can the product recover?

### Interaction Edge Cases

For each major interaction, probe:
- What happens if the user does it twice quickly? (Double-submit)
- What if they navigate away mid-action? (Back button, close tab)
- What if they have a slow/no connection?
- What if they're a first-time user vs. the 1000th time?
- What's the empty state? (Zero data, zero results, new account)

## Output Artifact: `04-user-journeys.md`

```markdown
# User Journey Maps — [Product Name]

## Primary Journey: [Persona Name]

### 1. Discovery
- **Trigger**: [What prompts them to look for a solution]
- **Action**: [How they find the product]
- **Emotion**: [What they're feeling — frustration, curiosity, desperation?]

### 2. Onboarding
- **Steps**: [Step-by-step first experience, minimum viable]
- **Required info**: [What they must provide — challenge each field]
- **Time to complete**: [Target in seconds/minutes]
- **Friction risks**: [Where they might abandon — and recovery strategy]

### 3. First Value Moment
- **What happens**: [The "aha" moment — be specific]
- **Time to value**: [From sign-up to "this was worth it"]
- **What they feel**: [Visceral emotional reaction]

### 4. Core Loop
- **Trigger**: [What initiates the action]
- **Action**: [What the user does]
- **Reward**: [What they get — emotional and functional]
- **Frequency**: [How often this repeats]

### 5. Success State (Day 30)
- **What a power user looks like**: [Specific behaviors and achievements]
- **Metrics that indicate success**: [Quantifiable signals]

### 6. Return Triggers
- [What brings them back — be specific about mechanisms, not hopes]

### 7. Failure Paths
| Drop-off Point | What User Feels | Can Product Recover? | Recovery Strategy |
|----------------|-----------------|---------------------|-------------------|
| [step] | [emotion] | Yes/No | [how] |

## Interaction State Map
| Interaction | Loading | Empty | Error | Success | Partial |
|-------------|---------|-------|-------|---------|---------|
| [each key interaction] | [what user sees] | [what user sees] | [what user sees] | [what user sees] | [what user sees] |
```

Include a secondary journey if a second persona was defined.

## Quality Gates

- [ ] First value moment is defined with a specific time estimate (challenge if > 2 min)
- [ ] Core loop is a clear trigger → action → reward cycle with frequency
- [ ] Failure paths are specific with recovery strategies (not just "user leaves")
- [ ] Interaction state map covers loading, empty, error, success, and partial states
- [ ] Empty states are designed as features (warmth + primary action), not just "No items found"
- [ ] Every step includes the user's emotional state, not just their action
