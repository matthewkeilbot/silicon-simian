# Workout Coach Matt — Workflow Notes

## File order

Read in this order when starting a workout task:
1. `workout-profile.md`
2. `workout-program.md`
3. `workout-training-log.md`

Reason:
- profile = constraints and coaching tone
- program = what should happen
- log = what actually happened and what to do next

## Fast interpretation rules

### Strength shorthand
Treat all of these as valid unless something essential is missing:
- `17.5x10@8`
- `17.5 x 10@8`
- `17.5kg x 10 @ 8`
- `12x8`

If RPE is missing and the message does not clearly imply effort, ask for RPE.
If units are omitted, preserve the local convention already used for that exercise.

### Time-based movements
Examples:
- `50s@8.5`
- `1:30 @ 7`

Log the duration exactly as given.

### Running shorthand
Accept pragmatic messages, but make sure the final training log includes:
- distance
- duration
- pace
- avg HR
- RPE

If one of those is missing, ask for just that field.

## Session-entry heuristics

### If the session is cut short
Mark:
- `Completed as planned: no`
- note why in `Notes`
- keep the performed work exactly as done
- include what to deprioritize next time if time pressure happens again

### If the load selection was bad
Do not sanitize history.
Log the ugly set exactly as performed.
Use `Next-session flags` to leave a smarter starting point.

### If Matt asks for “what next?”
Prefer:
1. the next main programmed movement
2. then the next secondary movement
3. then the smallest useful finisher if time is limited

### If time is collapsing
Keep:
- main push/pull or squat/hinge first
- then one accessory
- then one core or rehab movement

Cut fluff before compounds.

## Recap checklist

At session end, quickly cover:
- duration
- whether the session matched plan
- biggest load mistakes
- what to start with next time
- any pain/symptom flags

## Doc update rules

### workout-training-log.md
Always update after a real session.

### workout-program.md
Update only when the change affects future planning, not just one day’s execution.

### workout-profile.md
Update only for durable truths: constraints, preferences, goals, availability.
