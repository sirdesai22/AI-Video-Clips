import { z } from "zod";
import type { Recipe } from "./recipes";
import type { Format } from "./types";

export const SceneSchema = z.object({
  spoken: z.string(),
  onScreen: z.string().min(1),
  visual: z.string().min(1),
  estSeconds: z.number().positive(),
  motion: z.string().optional(),
  transition: z.string().optional(),
  block: z.string().optional(),
});

/** A Kokoro voice id such as "am_michael". */
export const VOICE_RE = /^[a-z]{2}_[a-z0-9]+$/;

const Hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex colour like #1D5AA6");

export const LookSchema = z.object({
  ground: Hex,
  ink: Hex,
  accent: Hex,
  type: z.string().min(1),
  captionStyle: z.string().min(1),
  voiceTone: z.string().min(1),
  musicMood: z.string().min(1),
});

export const ConceptSchema = z.object({
  device: z.string().min(1),
  form: z.string().min(1),
  spectacle: z.string().min(1),
});

export const ScriptSchema = z.object({
  title: z.string().min(1),
  idea: z.string().min(1),
  angle: z.string(),
  voice: z.string().regex(VOICE_RE, "must be a Kokoro voice id like am_michael"),
  look: LookSchema,
  concept: ConceptSchema,
  estSeconds: z.number().positive(),
  scenes: z.array(SceneSchema).min(1),
  sources: z.array(z.object({ url: z.string(), ok: z.boolean(), note: z.string().optional() })),
  claims: z.array(z.object({ text: z.string(), sceneIndex: z.number().int().min(0), source: z.string().nullable() })),
});

export type Script = z.infer<typeof ScriptSchema>;
export type Scene = z.infer<typeof SceneSchema>;

export const SPOKEN_MAX_WORDS = 19;
export const LIMITS = {
  reel: { onScreenWords: 6 },
  landscape: { onScreenWords: 10 },
} as const;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

export function validateScript(
  raw: unknown,
  ctx: { format: Format; recipe: Recipe },
): { ok: true; script: Script } | { ok: false; errors: string[] } {
  const parsed = ScriptSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const s = parsed.data;
  const { recipe } = ctx;
  const lim = LIMITS[ctx.format];
  const errors: string[] = [];
  if (s.scenes.length < recipe.scenes.min || s.scenes.length > recipe.scenes.max) {
    errors.push(`scenes: need ${recipe.scenes.min}-${recipe.scenes.max} scenes, got ${s.scenes.length}`);
  }
  if (recipe.angles.length ? !recipe.angles.includes(s.angle) : s.angle !== "") {
    errors.push(recipe.angles.length
      ? `angle: must be one of ${recipe.angles.join(", ")}`
      : "angle: must be empty for this video type");
  }
  s.scenes.forEach((sc, i) => {
    const sw = words(sc.spoken);
    if (recipe.narration) {
      if (sw === 0) errors.push(`scenes.${i}.spoken: must not be empty`);
      if (sw > SPOKEN_MAX_WORDS) errors.push(`scenes.${i}.spoken: ${sw} words, max ${SPOKEN_MAX_WORDS}`);
    } else if (sw > 0) {
      errors.push(`scenes.${i}.spoken: must be empty (this video type has no narration)`);
    }
    const ow = words(sc.onScreen);
    if (ow > lim.onScreenWords) errors.push(`scenes.${i}.onScreen: ${ow} words, max ${lim.onScreenWords}`);
    if (recipe.narration && norm(sc.onScreen) === norm(sc.spoken)) errors.push(`scenes.${i}.onScreen: must not repeat the spoken line`);
  });
  s.claims.forEach((c, i) => {
    if (c.sceneIndex >= s.scenes.length) errors.push(`claims.${i}.sceneIndex: no scene ${c.sceneIndex}`);
  });
  return errors.length ? { ok: false, errors } : { ok: true, script: s };
}

const HEX = "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$";

/** JSON Schema handed to `claude -p --json-schema`. Keep in sync with ScriptSchema. */
export const scriptJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "idea", "angle", "voice", "look", "concept", "estSeconds", "scenes", "sources", "claims"],
  properties: {
    title: { type: "string" },
    idea: { type: "string" },
    angle: { type: "string" },
    voice: { type: "string", pattern: "^[a-z]{2}_[a-z0-9]+$", enum: ["am_michael", "am_adam", "af_heart", "af_nova", "af_sky", "bm_george", "bf_emma", "bf_isabella"] },
    look: {
      type: "object",
      additionalProperties: false,
      required: ["ground", "ink", "accent", "type", "captionStyle", "voiceTone", "musicMood"],
      properties: {
        ground: { type: "string", pattern: HEX },
        ink: { type: "string", pattern: HEX },
        accent: { type: "string", pattern: HEX },
        type: { type: "string" },
        captionStyle: { type: "string" },
        voiceTone: { type: "string" },
        musicMood: { type: "string" },
      },
    },
    concept: {
      type: "object",
      additionalProperties: false,
      required: ["device", "form", "spectacle"],
      properties: { device: { type: "string" }, form: { type: "string" }, spectacle: { type: "string" } },
    },
    estSeconds: { type: "number" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["spoken", "onScreen", "visual", "estSeconds"],
        properties: {
          spoken: { type: "string" },
          onScreen: { type: "string" },
          visual: { type: "string" },
          estSeconds: { type: "number" },
          motion: { type: "string" },
          transition: { type: "string" },
          block: { type: "string" },
        },
      },
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        required: ["url", "ok"],
        properties: { url: { type: "string" }, ok: { type: "boolean" }, note: { type: "string" } },
      },
    },
    claims: {
      type: "array",
      items: {
        type: "object",
        required: ["text", "sceneIndex", "source"],
        properties: {
          text: { type: "string" },
          sceneIndex: { type: "integer" },
          source: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

/** Pull the script object out of `claude -p --output-format json` output. */
export function extractScript(result: unknown): unknown {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.structured_output && typeof r.structured_output === "object") return r.structured_output;
  if (typeof r.result === "string") {
    const t = r.result;
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
    }
  }
  return null;
}
