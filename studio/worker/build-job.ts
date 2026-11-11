import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { addEvent, addRender, getScript, getVideo, updateVideo } from "../lib/db";
import { kokoroPython, rendersDir } from "../lib/paths";
import { renderPrompt } from "../lib/prompts";
import { withLookDefaults } from "../lib/look-defaults";
import { getRecipe } from "../lib/recipes";
import { parseStreamLine, progressAtStart, stageIndex, type StageName } from "../lib/stages";
import type { Script } from "../lib/script-schema";
import type { BuildPayload, Job, Video } from "../lib/types";
import { modelArgs, runClaude } from "./claude";
import { captionsOn, prepareProject as prepareProjectRaw } from "./project";

const run = promisify(execFile);
export const BUILD_TIMEOUT_MS = 45 * 60 * 1000;
export const ALLOWED_TOOLS =
  "Read,Write,Edit,Glob,Grep,Skill,WebFetch,Bash(npx hyperframes:*),Bash(ffmpeg:*),Bash(ffprobe:*)";

/** Prepares the project so the next render lands at renders/v<renderVersion+1>.mp4. */
export async function prepareProject(v: Video, script: Script, keepBrief = false): Promise<string> {
  return prepareProjectRaw(v, script, `renders/v${v.renderVersion + 1}.mp4`, keepBrief);
}

/** The first-build prompt: prompts/build.md with the voice and caption stages set by the recipe and format. */
export function buildPrompt(v: Video, script: Script, renderRel: string): string {
  const recipe = getRecipe(v.recipe);
  return renderPrompt("build", {
    renderPath: renderRel,
    voiceStage: recipe.narration
      ? "Kokoro lines per BRIEF.md, one file per scene, each measured with ffprobe."
      : "print the line `STAGE: voice`, then `skipped (no narration)`, and move on: there is no TTS for this video.",
    captionsStage: captionsOn(v, recipe, script) ? ", plus the caption track" : "",
  });
}

export async function finalizeRender(videoId: string, renderPath: string): Promise<boolean> {
  if (!fs.existsSync(renderPath)) return false;
  let durationS = 0;
  try {
    const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", renderPath]);
    durationS = parseFloat(stdout.trim());
  } catch { return false; }
  if (!(durationS > 0)) return false;
  const poster = renderPath.replace(/\.mp4$/, ".jpg");
  try {
    await run("ffmpeg", ["-y", "-v", "error", "-ss", String(Math.min(1, durationS / 2)), "-i", renderPath, "-frames:v", "1", "-q:v", "3", poster]);
  } catch { /* poster is optional */ }
  const version = addRender(videoId, { path: renderPath, posterPath: fs.existsSync(poster) ? poster : null, durationS });
  updateVideo(videoId, { renderVersion: version });
  return true;
}

export async function runBuildJob(job: Job, opts: { timeoutMs?: number } = {}): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? BUILD_TIMEOUT_MS;
  const v = getVideo(job.videoId);
  if (!v) return;
  const payload = job.payload as unknown as BuildPayload;
  const row = getScript(v.id, v.scriptVersion);
  if (!row) {
    updateVideo(v.id, { status: "failed", error: "No approved script found" });
    return;
  }
  const n = v.renderVersion + 1;
  const renderRel = `renders/v${n}.mp4`;
  const renderAbs = path.join(rendersDir(v.id), `v${n}.mp4`);
  const resume = payload.mode !== "new" && !!v.sessionId;
  const script = withLookDefaults(row.script as Script);
  // A resumed session already read BRIEF.md; keep it as the agent saw it.
  const keepBrief = payload.mode === "revise" || (payload.mode === "retry" && resume);

  updateVideo(v.id, { status: "building", stage: "starting", progress: 0, error: null });
  addEvent(v.id, "log", `build ${payload.mode} → ${renderRel}`);

  let cwd: string;
  try {
    cwd = await prepareProject(v, script, keepBrief);
  } catch (e) {
    updateVideo(v.id, { status: "failed", error: `Couldn't set up the project: ${String(e).slice(0, 300)}` });
    return;
  }

  const prompt = payload.mode === "revise"
    ? renderPrompt("revise", { request: payload.request ?? "", renderPath: renderRel })
    : payload.mode === "retry" && resume
      ? renderPrompt("retry", { reason: v.error ?? "it was interrupted", renderPath: renderRel })
      : buildPrompt(v, script, renderRel);

  let current = -1;
  let resultError: string | null = null;
  const r = await runClaude({
    cwd,
    prompt,
    args: [
      "--output-format", "stream-json", "--verbose",
      "--permission-mode", "acceptEdits",
      "--allowedTools", ALLOWED_TOOLS,
      ...modelArgs(),
      ...(resume ? ["--resume", v.sessionId!] : []),
    ],
    env: { HYPERFRAMES_PYTHON: kokoroPython(), RENDER_PATH: renderAbs },
    timeoutMs,
    onLine: (line) => {
      const p = parseStreamLine(line);
      if (p.sessionId) updateVideo(v.id, { sessionId: p.sessionId });
      for (const t of p.texts) addEvent(v.id, "log", t);
      for (const t of p.tools) addEvent(v.id, "log", `→ ${t}`);
      if (p.stage && stageIndex(p.stage) > current) {
        current = stageIndex(p.stage);
        updateVideo(v.id, { stage: p.stage, progress: progressAtStart(p.stage as StageName) });
        addEvent(v.id, "stage", p.stage);
      }
      if (p.result?.isError) resultError = p.result.text;
    },
  });

  const ok = !r.timedOut && r.code === 0 && !resultError && (await finalizeRender(v.id, renderAbs));
  if (ok) {
    updateVideo(v.id, { status: "ready", stage: "done", progress: 100, error: null });
    addEvent(v.id, "stage", "done");
    return;
  }
  const mins = Math.max(1, Math.round(timeoutMs / 60000));
  const error = r.timedOut
    ? `Took longer than ${mins} minute${mins === 1 ? "" : "s"} and was stopped`
    : resultError ?? (r.code !== 0 ? `Agent exited with code ${r.code}: ${r.stderr.slice(-300)}` : "No video was rendered");
  updateVideo(v.id, { status: "failed", error });
  addEvent(v.id, "error", error);
}
