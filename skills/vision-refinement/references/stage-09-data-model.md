# Stage 9 — Core Data Model

## Role

Systems designer defining the conceptual data model.

## Context Required

Read all prior artifacts, especially `05-features.md` and `08-architecture.md`.

## Boundaries

- Conceptual clarity first — no SQL, no ORM code.
- Focus on entities, relationships, and ownership.
- Every entity must trace to a feature.

## Conversation Flow

1. **Core entities**: What are the main "things" in this system? (Users, items, transactions, etc.)
2. **Key attributes**: For each entity, what data must be stored? What's optional?
3. **Relationships**: How do entities relate? One-to-many? Many-to-many? Ownership chains?
4. **Ownership boundaries**: Who "owns" each entity? What are the access patterns?
5. **Data lifecycle**: How is data created, updated, archived, deleted? Retention policies?

## Output Artifact: `09-data-model.md`

```markdown
# Data Model Draft — [Product Name]

## Entities

### [Entity Name]
- **Description**: [What this represents]
- **Key Attributes**:
  - [attribute]: [type/description]
- **Relationships**:
  - [relationship to other entities]
- **Ownership**: [Who owns/controls this entity]
- **Lifecycle**: [Created when, updated how, deleted/archived when]

[Repeat for each entity]

## Entity Relationship Summary

[Text description or simple diagram of how entities connect]

## Data Lifecycle Considerations

- [Retention policies]
- [Archival strategy]
- [Deletion/anonymization requirements from NFRs]
```

## Quality Gates

- [ ] Every feature from Stage 5 is represented by at least one entity
- [ ] Relationships are explicit (not implied)
- [ ] Lifecycle addresses privacy requirements from Stage 6
- [ ] No premature schema optimization
