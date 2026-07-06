import {readState, todayInIct, withFreshDate} from "./workout-reminder-state.ts";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function minutesSinceMidnightIct(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function parseTime(value: string): number {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid time format: ${value}`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour * 60 + minute;
}

async function main() {
  const mode = getArg("mode");
  if (!mode) throw new Error("Missing --mode");

  const state = withFreshDate(await readState());
  const today = todayInIct();
  const nowMinutes = minutesSinceMidnightIct();

  if (state.date !== today) {
    console.log("skip:stale-state");
    return;
  }

  if (!state.scheduledWorkoutTimeIct) {
    console.log("skip:no-scheduled-time");
    return;
  }

  const scheduledMinutes = parseTime(state.scheduledWorkoutTimeIct);

  if (mode === "two-hour") {
    if (state.status === "scheduled" && nowMinutes >= scheduledMinutes - 120 && nowMinutes < scheduledMinutes - 25) {
      console.log(`send:two-hour:${state.scheduledWorkoutTimeIct}`);
      return;
    }
    console.log("skip:not-due");
    return;
  }

  if (mode === "thirty-minute") {
    if (state.status === "scheduled" && nowMinutes >= scheduledMinutes - 30 && nowMinutes < scheduledMinutes + 5) {
      console.log(`send:thirty-minute:${state.scheduledWorkoutTimeIct}`);
      return;
    }
    console.log("skip:not-due");
    return;
  }

  if (mode === "guilt-trip") {
    if (state.status === "scheduled" && nowMinutes >= scheduledMinutes - 20 && nowMinutes < scheduledMinutes + 20) {
      console.log(`send:guilt-trip:${state.scheduledWorkoutTimeIct}`);
      return;
    }
    console.log("skip:not-due");
    return;
  }

  if (mode === "mark-missed") {
    if (state.status === "scheduled" && nowMinutes >= scheduledMinutes + 180) {
      console.log("send:mark-missed");
      return;
    }
    console.log("skip:not-due");
    return;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
