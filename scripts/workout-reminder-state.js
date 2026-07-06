import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const STATE_DIR = "/home/openclaw/.openclaw/workspace/health-and-wellness/state";
const STATE_PATH = path.join(STATE_DIR, "workout-reminder-state.json");

export async function ensureStateDir() {
  await mkdir(STATE_DIR, {recursive: true});
}

export function todayInIct(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function makeDefaultState(date = todayInIct()) {
  return {
    date,
    status: "unknown",
    notes: [],
    sessionSelectionMode: "context-or-confirm",
    plannedSessionType: undefined,
    morningContextSummary: undefined,
    nextCoachAction: undefined,
    coachingTriggeredAt: undefined,
    twoHourReminderJobId: undefined,
    thirtyMinuteReminderJobId: undefined,
    guiltTripJobId: undefined,
    missedCheckJobId: undefined,
  };
}

export async function readState() {
  await ensureStateDir();
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return makeDefaultState();
    }
    throw error;
  }
}

export async function writeState(state) {
  await ensureStateDir();
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function withFreshDate(state, now = new Date()) {
  const today = todayInIct(now);
  if (state.date === today) return state;
  return makeDefaultState(today);
}
