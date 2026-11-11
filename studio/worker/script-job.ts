import fs from "node:fs";
import { addEvent, addScript, getScript, getVideo, updateVideo } from "../lib/db";
import { getRecipe, recipeText, type Recipe } from "../lib/recipes";
import { renderPrompt } from "../lib/prompts";
import { videoDir } from "../lib/paths";
import { extractScript, scriptJsonSchema, SPOKEN_MAX_WORDS, validateScript, VOICE_RE, type Script } from "../lib/script-schema";
import type { Job, ScriptPayload, Video } from "../lib/types";
import { modelArgs, runClaude } from "./claude";

export const SCRIPT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_VOICE = "am_michael";

/** One line per knob: the owner's value marked binding, or what the writer decides when unset. */
export function knobLines(v: Video, recipe: Recipe): string {
  const o = v.options;
  const q = (s: string) => JSON.stringify(s.trim());
  const set = (s?: string): s is string => !!s && s.trim() !== "";
  const lines: string[] = [];
  if (set(o.tone)) lines.push(`- tone: ${q(o.tone)} (owner's choice, BINDING)`);
  for (const k of recipe.knobs) {
    const val = o[k];
    switch (k) {
      case "angle":
        if (!recipe.angles.length) break;
        lines.push(set(val)
          ? `- angle: ${q(val)} (owner's choice, BINDING: set \`angle\` to exactly this and use its shape)`
          : `- angle: not set; pick the one the material fits from ${recipe.angles.join(", ")}`);
        break;
      case "palette":
        lines.push(set(val)
          ? `- palette: ${q(val)} (owner's choice, BINDING: \`look.ground\`, \`look.ink\` and \`look.accent\` realise exactly this)`
          : "- palette: not set; propose `look` from the subject's own world per the type's rules");
        break;
      case "voiceTone":
        lines.push(set(val)
          ? `- voiceTone: ${q(val)} (owner's choice, BINDING: \`look.voiceTone\` says this)`
          : "- voiceTone: not set; propose `look.voiceTone`");
        break;
      case "musicMood":
        lines.push(set(val)
          ? `- musicMood: ${q(val)} (owner's choice, BINDING: \`look.musicMood\` says this, with a tempo and level)`
          : "- musicMood: not set; propose `look.musicMood`");
        break;
      case "length":
        lines.push(set(val)
          ? `- length: ${q(val)} (owner's choice, BINDING: size the scenes so \`estSeconds\` lands in it)`
          : `- length: not set; aim for ${recipe.duration[v.format]}`);
        break;
      case "audience":
        lines.push(set(val)
          ? `- audience: ${q(val)} (owner's choice, BINDING: write for them)`
          : "- audience: not set; infer it from the input");
        break;
      case "exactWording":
        if (set(val)) lines.push(`- exact wording: ${q(val)} (owner's choice, BINDING: verbatim, unchanged, where the type's rules say)`);
        break;
      case "cta":
        if (set(val)) lines.push(`- call to action: ${q(val)} (owner's choice, BINDING: quoted exactly in the final scene's \`onScreen\`)`);
        break;
      case "voice":
        break; // the `voice` field carries it
    }
  }
  return lines.join("\n") || "none";
}

/** Kokoro voices the writer may pick from when the owner did not choose one. */
export const KOKORO_VOICES = [
  "am_michael (US male, calm)", "am_adam (US male)", "af_heart (US female, warm)", "af_nova (US female)",
  "af_sky (US female, bright)", "bm_george (UK male)", "bf_emma (UK female)", "bf_isabella (UK female)",
];

/** The `voice` instruction: the owner's voice binds the tone; otherwise the writer picks the id that matches the tone. */
export function voiceRule(v: Video, recipe: Recipe): string {
  const owner = v.options.voice?.trim();
  if (!recipe.narration) return `use "${owner && VOICE_RE.test(owner) ? owner : DEFAULT_VOICE}" (unused: no narration).`;
  if (owner && VOICE_RE.test(owner)) {
    const sex = owner[1] === "f" ? "female" : owner[1] === "m" ? "male" : null;
    return `use "${owner}" (owner's choice, BINDING).` +
      (sex ? ` \`look.voiceTone\` must fit it: a ${sex} voice.` : " `look.voiceTone` must fit it.");
  }
  return `pick the Kokoro id that matches \`look.voiceTone\` (same sex and accent), from: ${KOKORO_VOICES.join(", ")}. Default "${DEFAULT_VOICE}".`;
}

export function buildScriptPrompt(v: Video, previous: Script | null, note: string | null, errors: string[]): string {
  const recipe = getRecipe(v.recipe);
  const prev = previous
    ? `## Previous version\n${JSON.stringify(previous, null, 2)}\n\nREWRITE NOTE: ${note ?? "make it better"}\nKeep what works; change what the note asks.\n\n`
    : "";
  const errs = errors.length ? `## Fix these problems from your last attempt\n${errors.map((e) => `- ${e}`).join("\n")}\n\n` : "";
  const spokenRule = recipe.narration
    ? `   - \`spoken\`: what the narrator says, at most ${SPOKEN_MAX_WORDS} words, conversational, written as short phrases the picture can land on.`
    : '   - `spoken`: exactly "" (empty). This type has no narrator.';
  const estRule = recipe.narration
    ? "   - `estSeconds`: about 0.4 s per spoken word plus 0.6 s."
    : "   - `estSeconds`: the exact length of the beat in seconds, not a word count.";
  return renderPrompt("script", {
    recipeLabel: recipe.label,
    duration: recipe.duration[v.format],
    scenesMin: String(recipe.scenes.min),
    scenesMax: String(recipe.scenes.max),
    narrationLine: recipe.narration
      ? "Narrated: every scene has a spoken line."
      : 'No narration: every `spoken` is "" and the words on screen carry it.',
    formatRules: renderPrompt(v.format === "reel" ? "reel-rules" : "landscape-rules", {}).trim(),
    spokenRule,
    estRule,
    onScreenRule: recipe.narration
      ? ", and NEVER the same as `spoken` (show the number, the keyword or the punchline)."
      : "; it is every word the viewer reads.",
    voiceRule: voiceRule(v, recipe),
    angleRule: recipe.angles.length
      ? `exactly one of ${recipe.angles.join(", ")}.`
      : '"" (empty): this type has no angles.',
    recipeRules: recipeText(recipe.id, "script").trim(),
    knobs: knobLines(v, recipe),
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
    const check = validateScript(extractScript(parsed), { format: v.format, recipe: getRecipe(v.recipe) });
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
