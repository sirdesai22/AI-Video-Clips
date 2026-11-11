import fs from "node:fs";
import { addEvent, addScript, getScript, getVideo, updateVideo } from "../lib/db";
import { renderPrompt } from "../lib/prompts";
import { videoDir } from "../lib/paths";
import { extractScript, scriptJsonSchema, validateScript, type Script } from "../lib/script-schema";
import type { Job, ScriptPayload, Video } from "../lib/types";
import { modelArgs, runClaude } from "./claude";

export const SCRIPT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_VOICE = "am_michael";

export function buildScriptPrompt(v: Video, previous: Script | null, note: string | null, errors: string[]): string {
  const o = v.options;
  const options = [
    o.tone && `tone: ${o.tone}`,
    o.length && `target length: ${o.length}`,
    o.audience && `audience: ${o.audience}`,
    o.exactWording && `keep this wording exactly: ${o.exactWording}`,
    o.cta && `end with: ${o.cta}`,
  ].filter(Boolean).join("\n") || "none";
  const prev = previous
    ? `## Previous version\n${JSON.stringify(previous, null, 2)}\n\nREWRITE NOTE: ${note ?? "make it better"}\nKeep what works; change what the note asks.`
    : "";
  const errs = errors.length ? `## Fix these problems from your last attempt\n${errors.map((e) => `- ${e}`).join("\n")}` : "";
  return renderPrompt("script", {
    formatRules: renderPrompt(v.format === "reel" ? "reel-rules" : "explainer-rules", {}),
    voice: o.voice || DEFAULT_VOICE,
    options,
    previous: prev,
    errors: errs,
    input: v.input,
  });
}

export async function runScriptJob(job: Job, opts: { timeoutMs?: number } = {}): Promise<void> {
  const v = getVideo(job.videoId);
  if (!v) return;
  const { note } = job.payload as ScriptPayload;
  const previous = note ? ((getScript(v.id, v.scriptVersion)?.script as Script | undefined) ?? null) : null;
  const cwd = videoDir(v.id);
  fs.mkdirSync(cwd, { recursive: true });
  updateVideo(v.id, { status: "scripting", error: null });

  let errors: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await runClaude({
      cwd,
      prompt: buildScriptPrompt(v, previous, note ?? null, errors),
      args: ["--output-format", "json", "--json-schema", JSON.stringify(scriptJsonSchema),
        "--allowedTools", "WebFetch,WebSearch", ...modelArgs()],
      timeoutMs: opts.timeoutMs ?? SCRIPT_TIMEOUT_MS,
    });
    if (r.timedOut) { errors = ["timed out"]; break; }
    let parsed: Record<string, unknown> | null = null;
    try { parsed = JSON.parse(r.stdout.trim().split("\n").pop() ?? ""); } catch { parsed = null; }
    if (!parsed) {
      errors = [`no output (${r.stderr.slice(0, 300) || `exit ${r.code}`})`];
      addEvent(v.id, "log", `script attempt ${attempt + 1} gave no parseable output`);
      continue;
    }
    if (parsed.is_error) { errors = [String(parsed.result ?? "agent error")]; break; }
    const check = validateScript(extractScript(parsed), v.format);
    if (check.ok) {
      const version = addScript(v.id, check.script, note ?? null);
      updateVideo(v.id, { status: "script_ready", title: check.script.title, scriptVersion: version, error: null });
      addEvent(v.id, "stage", `script v${version} ready`);
      return;
    }
    errors = check.errors;
    addEvent(v.id, "log", `script attempt ${attempt + 1} invalid: ${errors.join("; ")}`);
  }
  updateVideo(v.id, { status: "script_failed", error: `Couldn't write a script: ${errors.join("; ").slice(0, 500)}` });
  addEvent(v.id, "error", errors.join("; "));
}
