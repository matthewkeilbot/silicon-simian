import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {readState, todayInIct, writeState} from "./workout-reminder-state.js";

const execFileAsync = promisify(execFile);
const TELEGRAM_TARGET = "-1003879033199:topic:2033";
const TZ = "Asia/Bangkok";

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function appendNote(notes, note) {
  const next = notes ? [...notes] : [];
  next.push(note);
  return next.slice(-30);
}

function buildIsoForIct(date, time) {
  return `${date}T${time}:00+07:00`;
}

async function runOpenclaw(args) {
  const {stdout} = await execFileAsync("openclaw", args, {
    cwd: "/home/openclaw/.openclaw/workspace",
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function maybeRemove(jobId) {
  if (!jobId) return;
  try {
    await runOpenclaw(["cron", "rm", jobId]);
  } catch {
    // ignore already-gone jobs
  }
}

async function addOneShot({name, at, message}) {
  const output = await runOpenclaw([
    "cron",
    "add",
    "--name",
    name,
    "--at",
    at,
    "--session",
    "isolated",
    "--message",
    message,
    "--announce",
    "--channel",
    "telegram",
    "--to",
    TELEGRAM_TARGET,
    "--model",
    "haiku",
    "--thinking",
    "off",
    "--light-context",
  ]);
  return JSON.parse(output).id;
}

async function main() {
  const time = getArg("time");
  if (!time) throw new Error("Missing --time HH:MM");

  const state = await readState();
  const date = todayInIct();
  state.date = date;
  state.status = "scheduled";
  state.scheduledWorkoutTimeIct = time;

  await maybeRemove(state.twoHourReminderJobId);
  await maybeRemove(state.thirtyMinuteReminderJobId);
  await maybeRemove(state.guiltTripJobId);
  await maybeRemove(state.missedCheckJobId);

  const twoHourAt = buildIsoForIct(date, offsetTime(time, -120));
  const thirtyAt = buildIsoForIct(date, offsetTime(time, -30));
  const guiltAt = buildIsoForIct(date, offsetTime(time, 0));
  const missedAt = buildIsoForIct(date, "23:00");

  state.twoHourReminderJobId = await addOneShot({
    name: `workout-reminder-2h-${date}`,
    at: twoHourAt,
    message: "Read and follow the workout-coach-matt skill. This is the 2-hour pre-workout reminder for Matt in MEK topic 2033. Before replying, read /home/openclaw/.openclaw/workspace/health-and-wellness/state/workout-reminder-state.json and /home/openclaw/.openclaw/workspace/health-and-wellness/workout-training-log.md. If today's workout is already logged or state says left/logged/rest/missed, say nothing. Otherwise send a terse reminder to protect the workout slot and stay on plan.",
  });

  state.thirtyMinuteReminderJobId = await addOneShot({
    name: `workout-reminder-30m-${date}`,
    at: thirtyAt,
    message: "Read and follow the workout-coach-matt skill. This is the 30-minute pre-workout reminder for Matt in MEK topic 2033. Before replying, read /home/openclaw/.openclaw/workspace/health-and-wellness/state/workout-reminder-state.json and /home/openclaw/.openclaw/workspace/health-and-wellness/workout-training-log.md. If today's workout is already logged or state says left/logged/rest/missed, say nothing. Otherwise tell him to get ready and send 'leaving now' when he heads to the gym.",
  });

  state.guiltTripJobId = await addOneShot({
    name: `workout-reminder-guilt-${date}`,
    at: guiltAt,
    message: "Read and follow the workout-coach-matt skill. This is the post-departure check for Matt in MEK topic 2033. Before replying, read /home/openclaw/.openclaw/workspace/health-and-wellness/state/workout-reminder-state.json and /home/openclaw/.openclaw/workspace/health-and-wellness/workout-training-log.md. If state says left/logged/rest/missed or today's workout is already logged, say nothing. Otherwise send a short guilt-trip about not showing up for himself because no 'leaving now' message arrived.",
  });

  state.missedCheckJobId = await addOneShot({
    name: `workout-reminder-missed-${date}`,
    at: missedAt,
    message: "Read and follow the workout-coach-matt skill. This is the missed-workout check for Matt in MEK topic 2033. Before replying, read /home/openclaw/.openclaw/workspace/health-and-wellness/state/workout-reminder-state.json and /home/openclaw/.openclaw/workspace/health-and-wellness/workout-training-log.md. If today's workout is already logged or state says left/logged/rest/missed, say nothing. Otherwise run: npm run workout:state -- --mode missed . Then send one short message saying the workout was missed and tomorrow's check-in will reflect it.",
  });

  state.notes = appendNote(state.notes, `Scheduled one-shot reminders for ${time} ICT`);
  await writeState(state);
  console.log(JSON.stringify(state, null, 2));
}

function offsetTime(time, deltaMinutes) {
  const [hourRaw, minuteRaw] = time.split(":").map(Number);
  const total = hourRaw * 60 + minuteRaw + deltaMinutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
