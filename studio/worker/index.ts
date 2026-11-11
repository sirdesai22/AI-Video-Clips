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

export async function main(): Promise<never> {
  const n = markInterrupted();
  console.log(`[worker] started${n ? `, marked ${n} interrupted job(s)` : ""}`);
  for (;;) {
    const ran = await processNext();
    if (!ran) await new Promise((r) => setTimeout(r, 1500));
  }
}
