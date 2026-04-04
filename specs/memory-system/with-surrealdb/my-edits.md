
## What changed in this branch

Compared to the initial draft:

- SurrealDB is no longer treated as a late optional experiment.
- The spec now assumes a derived structured layer with these primary objects:
  - `episode`
  - `entity`
  - `assertion`
  - `summary`
  - relation records for provenance, supersession, contradiction, and relevance
- Retrieval is now modeled as a **two-plane system**:
  1. text recall (Markdown + QMD/builtin memory search)
  2. structured recall (SurrealDB assertions/entities/summaries)
