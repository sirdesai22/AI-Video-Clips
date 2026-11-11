import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { agentPidFile, workerPidFile } from "../lib/paths";
import { addEvent, claimNextJob, finishJob, getVideo, markInterrupted, updateVideo } from "../lib/db";
import { runBuildJob } from "./build-job";
import { runScriptJob } from "./script-job";

export async function processNext(): Promise<boolean> {
  const job = claimNextJob();
  if (!job) return false;
  try {
    if (job.kind === "script") await runScriptJob(job);
    else await runBuildJob(job);
    const v = getVideo(job.videoId);
    finishJob(job.id, v && (v.status === "failed" || v.status === "script_failed") ? "failed" : "done");
  } catch (e) {
    const msg = `Unexpected error: ${String(e).slice(0, 400)}`;
    updateVideo(job.videoId, { status: job.kind === "script" ? "script_failed" : "failed", error: msg });
    addEvent(job.videoId, "error", msg);
    finishJob(job.id, "failed");
  }
  return true;
}

function readPid(file: string): number | null {
  try {
    const n = Number(fs.readFileSync(file, "utf8").trim());
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch { return null; }
}

const defaultCommandOf = (pid: number) =>
  execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" });

/** Kills an agent process group left behind by a previous worker, then clears the pid file. */
export function cleanupStaleAgent(
  file: string = agentPidFile(),
  commandOf: (pid: number) => string = defaultCommandOf,
  pattern: RegExp = /claude|fake-claude/,
): boolean {
  const pid = readPid(file);
  let killed = false;
  if (pid) {
    try {
      const cmd = commandOf(pid);
      if (pattern.test(cmd)) {
        process.kill(-pid, "SIGKILL");
        killed = true;
      }
    } catch { /* gone or not ours */ }
  }
  try { fs.rmSync(file, { force: true }); } catch { /* best effort */ }
  return killed;
}

/** Returns false when another live worker already holds the lock. */
export function acquireWorkerLock(file: string = workerPidFile()): boolean {
  const pid = readPid(file);
  if (pid && pid !== process.pid) {
    try {
      process.kill(pid, 0);
      console.log(`[worker] another worker is running (pid ${pid}); exiting`);
      return false;
    } catch { /* stale */ }
  }
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, String(process.pid));
  } catch { /* best effort */ }
  return true;
}

export function releaseWorkerLock(file: string = workerPidFile()): void {
  try {
    if (readPid(file) === process.pid) fs.rmSync(file, { force: true });
  } catch { /* best effort */ }
}

export async function main(): Promise<never> {
  if (!acquireWorkerLock()) process.exit(0);
  process.once("exit", () => releaseWorkerLock());
  cleanupStaleAgent();
  const n = markInterrupted();
  console.log(`[worker] started${n ? `, marked ${n} interrupted job(s)` : ""}`);
  for (;;) {
    const ran = await processNext();
    if (!ran) await new Promise((r) => setTimeout(r, 1500));
  }
}
