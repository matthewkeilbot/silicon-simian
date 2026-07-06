import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

export type ReminderState = {
  date: string;
  status: "unknown" | "rest" | "scheduled" | "left" | "logged" | "missed";
  scheduledWorkoutTimeIct?: string;
  lastSourceMessageId?: string;
  leavingNowReceivedAt?: string;
  workoutLoggedAt?: string;
  notes?: string[];
};

const STATE_DIR = "/home/openclaw/.openclaw/workspace/health-and-wellness/state";
const STATE_PATH = path.join(STATE_DIR, "workout-reminder-state.json");

export async function ensureStateDir(): Promise<void> {
  await mkdir(STATE_DIR, {recursive: true});
}

export function todayInIct(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function makeDefaultState(date = todayInIct()): ReminderState {
  return {
    date,
    status: "unknown",
    notes: [],
  };
}

export async function readState(): Promise<ReminderState> {
  await ensureStateDir();
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    return JSON.parse(raw) as ReminderState;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return makeDefaultState();
    }
    throw error;
  }
}

export async function writeState(state: ReminderState): Promise<void> {
  await ensureStateDir();
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function withFreshDate(state: ReminderState, now = new Date()): ReminderState {
  const today = todayInIct(now);
  if (state.date === today) return state;
  return makeDefaultState(today);
}
