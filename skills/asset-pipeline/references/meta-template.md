# Final Asset Meta Template

Use this template for `YYYY-MM-DD-DESCRIPTION.meta.md`.

```markdown
---
asset_id: 2026-03-04-curly-robot-avatar
asset_type: image
status: final
created_at_utc: 2026-03-04T13:00:00Z
finalized_at_utc: 2026-03-04T13:22:00Z
request_context:
  channel: telegram
  chat_id: "telegram:-1003879033199"
  thread_id: "302"
  request_message_id: "123"
  delivery_message_id: "124"
storage:
  local_final_path: assets/final/image/2026-03-04-curly-robot-avatar.webp
  local_meta_path: assets/final/image/2026-03-04-curly-robot-avatar.meta.md
  offload_state: pending
  offload_due_at_utc: 2026-03-11T13:22:00Z
naming:
  date_prefix: "2026-03-04"
  description: curly-robot-avatar
  version: 1
source_strategy:
  mode: multi-engine
  engines_tried:
    - midjourney
    - nano-banana
  candidates_per_engine: 2
retention:
  working_ttl_days: 3
  final_local_ttl_days: 7
cost:
  estimated_usd: null
  currency: USD
notes: "Final selected by user after round 2."
---

## Iteration 2 (Newest)

### User Feedback
"Make the curls more symmetrical and use a darker navy background."

### Prompt Sent
"Create a friendly robot avatar with symmetrical ringlet curls and a dark navy rounded-square background..."

### Model/Engine Meta Sent
- engine: midjourney
- model: vX
- params:
  - aspect_ratio: 1:1
  - style: raw
  - quality: high
  - seed: 12345
- output_format: webp

### Outputs
- assets/working/image/2026-03-04-curly-robot-avatar--wrk-j8f2-midjourney-r2-c1.webp
- assets/working/image/2026-03-04-curly-robot-avatar--wrk-j8f2-midjourney-r2-c2.webp

---

## Iteration 1 (Oldest)

### User Feedback
"Make a curly robot avatar."

### Prompt Sent
"Design a cute robot avatar with curly hair, friendly green eyes, and soft highlights..."

### Model/Engine Meta Sent
- engine: nano-banana
- model: vY
- params:
  - size: 1024x1024
  - seed: 9001
- output_format: png

### Outputs
- assets/working/image/2026-03-04-curly-robot-avatar--wrk-j8f2-nano-banana-r1-c1.png
- assets/working/image/2026-03-04-curly-robot-avatar--wrk-j8f2-nano-banana-r1-c2.png
```
