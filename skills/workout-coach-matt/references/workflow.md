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

For run coaching, default to 10k-base logic unless Matt says otherwise:
- favor easy, conversational efforts
- progress through small duration/distance bumps
- avoid turning every run into a pace test
- if recovery markers are poor, downgrade to walk/recovery work

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

For run/recovery days, prefer:
1. recovery check
2. easy run or walk recommendation
3. mobility/recovery suggestion if training readiness is poor

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
- biggest load or pacing mistakes
- what to start with next time
- any pain/symptom or recovery flags

## Doc update rules

### workout-training-log.md
Always update after a real session.

### workout-program.md
Update only when the change affects future planning, not just one day’s execution.

### workout-profile.md
Update only for durable truths: constraints, preferences, goals, availability.

## Daily reminder behavior

Morning check-in rules:
- always start with health/recovery
- on workout days, ask what time the workout is scheduled
- on rest days, steer based on recovery state: rest, walk, easy yoga/mobility, massage, or similar recovery path
- if a workout was missed the previous day, mention it in the next morning check-in

State file:
- `/home/openclaw/.openclaw/workspace/health-and-wellness/state/workout-reminder-state.json`
- maintain it with:
  - `npm run workout:schedule -- --time HH:MM` when the workout time becomes known or changes
  - `npm run workout:state -- --mode rest`
  - `npm run workout:state -- --mode left`
  - `npm run workout:state -- --mode logged`
  - `npm run workout:state -- --mode infer-from-log`

One-shot reminder model:
- when a workout time is known, create four one-shot crons for that date:
  - T-2h reminder
  - T-30m reminder
  - on-time guilt-trip check if no `leaving now`
  - 23:00 ICT missed-workout check
- if Matt changes the workout time, reschedule the one-shot jobs and treat the newest time as truth

Pre-workout reminder rules:
- send one reminder 2 hours before the chosen workout time
- send one reminder 30 minutes before the chosen workout time
- if no `leaving now` message appears after the 30-minute reminder window, send a guilt-trip nudge about not showing up for himself
- if the workout is still not logged much later, mark it missed in state so the next morning check-in can mention it
