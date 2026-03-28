---
name: vision-refinement
description: >
  Interactive 10-stage product vision refinement process that transforms a raw app idea
  into a complete pre-PRD foundation. Walk through vision extraction, personas, problem
  definition, user journeys, features, NFRs, constraints, architecture, data model, and
  risk analysis — producing durable artifacts at each stage. Use when: (1) starting a new
  product/app idea from scratch, (2) user wants to flesh out or formalize a product concept,
  (3) user says "new product", "app idea", "vision refinement", "pre-PRD", "product definition",
  (4) user opens a thread to brainstorm a product. NOT for: existing PRDs that need editing,
  pure technical architecture without product context, or post-PRD implementation planning.
---

# Vision Refinement

Interactive 10-stage workflow that transforms a raw product idea into a structured pre-PRD
foundation. Each stage is a focused conversation that produces a durable document artifact.

## Quick Start

1. Ask the user for the product name (used for folder naming).
2. Create the project folder: `workspace/products/<PRODUCT_NAME>/`
3. Begin Stage 1. Work through each stage sequentially.
4. At each stage: read the stage reference, conduct the interactive conversation, produce the artifact, save it, then advance.

## Workflow

### Stage Sequence

| # | Stage | Artifact | Reference |
|---|-------|----------|-----------|
| 1 | Vision Extraction | `01-vision-brief.md` | `references/stage-01-vision.md` |
| 2 | Target Users & Personas | `02-personas.md` | `references/stage-02-personas.md` |
| 3 | Problem & Value Definition | `03-problem-value.md` | `references/stage-03-problem.md` |
| 4 | User Journeys | `04-user-journeys.md` | `references/stage-04-journeys.md` |
| 5 | Feature Definition | `05-features.md` | `references/stage-05-features.md` |
| 6 | Non-Functional Requirements | `06-nfr.md` | `references/stage-06-nfr.md` |
| 7 | Constraints & Guardrails | `07-constraints.md` | `references/stage-07-constraints.md` |
| 8 | High-Level Architecture | `08-architecture.md` | `references/stage-08-architecture.md` |
| 9 | Core Data Model | `09-data-model.md` | `references/stage-09-data-model.md` |
| 10 | Risk & Open Questions | `10-risks.md` | `references/stage-10-risks.md` |

### Stage Execution Protocol

For each stage:

1. **Read** the corresponding `references/stage-XX-*.md` file for prompts and structure.
2. **Carry forward** all previously finalized artifacts as context (read them from disk).
3. **Converse** interactively — ask the questions from the reference, push for specificity, challenge vagueness.
4. **Draft** the artifact once the conversation reaches clarity.
5. **Present** the draft to the user for review/approval.
6. **Save** the finalized artifact to `workspace/products/<PRODUCT_NAME>/XX-artifact-name.md`.
7. **Advance** to the next stage only after user confirms.

### Model Strategy

- **Primary generation**: Use opus (best available model) for all stage conversations and artifact drafting.
- **Multi-model audit**: After completing stages 5 (features) and 8 (architecture), spawn sub-agents using Codex and Gemini to review the artifacts and provide feedback. Incorporate valuable feedback before finalizing.
- **Final review**: After stage 10, spawn audit sub-agents to review the complete artifact set for consistency, gaps, and contradictions.

### Audit Protocol

When triggering a multi-model audit:

1. Spawn a Codex sub-agent with the artifacts to review — ask it to identify gaps, contradictions, missing edge cases, and suggestions.
2. Spawn a Gemini sub-agent (via gemini skill) with the same artifacts — ask for an independent review.
3. Synthesize feedback from both, present a summary to the user, and incorporate approved changes.

### Conversation Style

- Be a sharp, opinionated product strategist — not a passive note-taker.
- Challenge weak reasoning. Ask "why?" and "what if that's wrong?"
- Push for specificity: reject vague answers like "users want it to be fast."
- Keep each stage focused — do not let conversation drift to other stages.
- When the user goes broad, pull them back: "We'll cover that in Stage X. Right now: [focus]."

### Project Folder Structure

```
workspace/products/<PRODUCT_NAME>/
├── 01-vision-brief.md
├── 02-personas.md
├── 03-problem-value.md
├── 04-user-journeys.md
├── 05-features.md
├── 06-nfr.md
├── 07-constraints.md
├── 08-architecture.md
├── 09-data-model.md
├── 10-risks.md
└── README.md          (auto-generated index after completion)
```

### Resuming a Session

If the conversation is interrupted or continued later:

1. Check `workspace/products/<PRODUCT_NAME>/` for existing artifacts.
2. Identify the last completed stage by file presence.
3. Read all existing artifacts for context.
4. Resume at the next incomplete stage.

### Completion

After all 10 stages and the final audit:

1. Generate `README.md` — an index with one-line summaries of each artifact.
2. Inform the user that the pre-PRD foundation is complete.
3. Note that these artifacts form the foundation for: PRD authoring, technical specification, and AI-assisted implementation prompts.
