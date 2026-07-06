import {readFile} from "node:fs/promises";
import {readState, withFreshDate, writeState} from "./workout-reminder-state.ts";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function appendNote(notes: string[] | undefined, note: string): string[] {
  const next = notes ? [...notes] : [];
  next.push(note);
  return next.slice(-20);
}

async function main() {
  const mode = getArg("mode");
  const value = getArg("value");
  const messageId = getArg("message-id");

  if (!mode) {
    throw new Error("Missing --mode");
  }

  let state = withFreshDate(await readState());

  switch (mode) {
    case "schedule": {
      if (!value) throw new Error("Missing --value for schedule mode");
      state.status = "scheduled";
      state.scheduledWorkoutTimeIct = value;
      state.lastSourceMessageId = messageId;
      state.notes = appendNote(state.notes, `Scheduled workout at ${value} ICT`);
      break;
    }
    case "rest": {
      state.status = "rest";
      state.scheduledWorkoutTimeIct = undefined;
      state.lastSourceMessageId = messageId;
      state.notes = appendNote(state.notes, "Marked as rest/recovery day");
      break;
    }
    case "left": {
      state.status = "left";
      state.leavingNowReceivedAt = new Date().toISOString();
      state.lastSourceMessageId = messageId;
      state.notes = appendNote(state.notes, "Received leaving now");
      break;
    }
    case "logged": {
      state.status = "logged";
      state.workoutLoggedAt = new Date().toISOString();
      state.lastSourceMessageId = messageId;
      state.notes = appendNote(state.notes, "Workout/run logged");
      break;
    }
    case "missed": {
      state.status = "missed";
      state.lastSourceMessageId = messageId;
      state.notes = appendNote(state.notes, "Marked missed workout");
      break;
    }
    case "show": {
      console.log(JSON.stringify(state, null, 2));
      return;
    }
    case "infer-from-log": {
      const logPath = "/home/openclaw/.openclaw/workspace/health-and-wellness/workout-training-log.md";
      const raw = await readFile(logPath, "utf8");
      if (raw.includes(`## ${state.date} —`)) {
        state.status = "logged";
        state.workoutLoggedAt = state.workoutLoggedAt ?? new Date().toISOString();
        state.notes = appendNote(state.notes, "Found same-day entry in workout log");
      }
      break;
    }
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }

  await writeState(state);
  console.log(JSON.stringify(state, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
