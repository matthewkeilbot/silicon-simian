# Stage 9 — Core Data Model

## Role

Systems designer defining the conceptual data model.

## Context Required

Read all prior artifacts, especially `05-features.md` and `08-architecture.md`.

## Boundaries

- Conceptual clarity first — no SQL, no ORM code.
- Focus on entities, relationships, and ownership.
- Every entity must trace to a feature.
- Think about the four data paths: happy, nil, empty, error.

## Conversation Flow

1. **Core entities**: What are the main "things" in this system? Derive from features — every feature implies at least one entity.
2. **Key attributes**: For each entity, what data must be stored? Challenge each attribute: "Do we need this at launch or is it Phase 2?"
3. **Relationships**: How do entities relate? One-to-many? Many-to-many? Ownership chains? Draw it out.
4. **Ownership boundaries**: Who "owns" each entity? What are the access patterns? Can user A see user B's data? (Cross-reference security from Stage 6.)
5. **Data lifecycle**: How is data created, updated, archived, deleted? Match to privacy requirements from Stage 6.
6. **Edge cases**: For each entity:
   - What happens when it's nil/missing?
   - What happens when it's empty (present but zero-length)?
   - What happens when related data is deleted? Cascade? Orphan? Soft-delete?
   - What's the maximum realistic size? (e.g., a name field: 47 chars? 200?)

## Output Artifact: `09-data-model.md`

```markdown
# Data Model Draft — [Product Name]

## Entity Map

[ASCII diagram showing entities and relationships]

```
  USER ──1:N──▶ PROJECT ──1:N──▶ TASK
    │                              │
    └──────1:N──▶ NOTIFICATION ◀──┘
```

## Entities

### [Entity Name]
- **Description**: [What this represents in the user's mental model]
- **Key Attributes**:
  - `id`: [type — UUID vs auto-increment, with reasoning]
  - `[attribute]`: [type, required/optional, constraints]
  - `[attribute]`: [type, max length, validation rules]
- **Relationships**:
  - belongs_to [entity] (required/optional)
  - has_many [entity] (cascade delete? orphan? soft-delete?)
- **Ownership**: [Who owns/controls this — user, org, system?]
- **Access patterns**: [Who can read? Write? Delete? Cross-reference Stage 6 security.]
- **Lifecycle**: [Created when → updated how → archived/deleted when]
- **Edge cases**:
  - Nil: [what happens if this entity doesn't exist when expected]
  - Empty: [what if it exists but has no children/content]
  - Max size: [realistic upper bounds for key attributes]
  - Deletion: [cascade behavior for related entities]

[Repeat for each entity]

## Entity-Feature Traceability

| Entity | Features That Use It | Created By | Deleted By |
|--------|---------------------|-----------|-----------|
| [entity] | [feature list] | [which action] | [which action or "never"] |

## Data Lifecycle Summary

| Entity | Retention | Archive Strategy | Deletion Trigger | Privacy Impact |
|--------|----------|-----------------|-----------------|---------------|
| [entity] | [how long] | [how archived] | [what triggers deletion] | [PII? GDPR?] |

## Open Questions

[Data model decisions that need validation — e.g., "Should tasks be soft-deleted or hard-deleted? Depends on whether users need undo."]
```

## Quality Gates

- [ ] Every feature from Stage 5 is represented by at least one entity
- [ ] Relationships are explicit with cascade/orphan behavior defined
- [ ] Lifecycle addresses privacy requirements from Stage 6
- [ ] Ownership and access patterns are defined (who sees what)
- [ ] Edge cases (nil, empty, max size, deletion) are addressed per entity
- [ ] Entity-feature traceability is complete
- [ ] No premature schema optimization — conceptual clarity over technical perfection
