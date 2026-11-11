import { z } from "zod";
import type { Format } from "./types";

export const SceneSchema = z.object({
  spoken: z.string().min(1),
  onScreen: z.string().min(1),
  visual: z.string().min(1),
  estSeconds: z.number().positive(),
});

export const ScriptSchema = z.object({
  title: z.string().min(1),
  idea: z.string().min(1),
  angle: z.enum(["concept", "how-to", "listicle", "story"]),
  voice: z.string().min(1),
  estSeconds: z.number().positive(),
  scenes: z.array(SceneSchema).min(1),
  sources: z.array(z.object({ url: z.string(), ok: z.boolean(), note: z.string().optional() })),
  claims: z.array(z.object({ text: z.string(), sceneIndex: z.number().int().min(0), source: z.string().nullable() })),
});

export type Script = z.infer<typeof ScriptSchema>;
export type Scene = z.infer<typeof SceneSchema>;

export const SPOKEN_MAX_WORDS = 19;
export const LIMITS = {
  reel: { onScreenWords: 6, minScenes: 4, maxScenes: 12 },
  explainer: { onScreenWords: 10, minScenes: 4, maxScenes: 16 },
} as const;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

export function validateScript(
  raw: unknown,
  format: Format,
): { ok: true; script: Script } | { ok: false; errors: string[] } {
  const parsed = ScriptSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const s = parsed.data;
  const lim = LIMITS[format];
  const errors: string[] = [];
  if (s.scenes.length < lim.minScenes || s.scenes.length > lim.maxScenes) {
    errors.push(`scenes: need ${lim.minScenes}-${lim.maxScenes} scenes, got ${s.scenes.length}`);
  }
  s.scenes.forEach((sc, i) => {
    const sw = words(sc.spoken);
    if (sw > SPOKEN_MAX_WORDS) errors.push(`scenes.${i}.spoken: ${sw} words, max ${SPOKEN_MAX_WORDS}`);
    const ow = words(sc.onScreen);
    if (ow > lim.onScreenWords) errors.push(`scenes.${i}.onScreen: ${ow} words, max ${lim.onScreenWords}`);
    if (norm(sc.onScreen) === norm(sc.spoken)) errors.push(`scenes.${i}.onScreen: must not repeat the spoken line`);
  });
  s.claims.forEach((c, i) => {
    if (c.sceneIndex >= s.scenes.length) errors.push(`claims.${i}.sceneIndex: no scene ${c.sceneIndex}`);
  });
  return errors.length ? { ok: false, errors } : { ok: true, script: s };
}

/** JSON Schema handed to `claude -p --json-schema`. Keep in sync with ScriptSchema. */
export const scriptJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "idea", "angle", "voice", "estSeconds", "scenes", "sources", "claims"],
  properties: {
    title: { type: "string" },
    idea: { type: "string" },
    angle: { type: "string", enum: ["concept", "how-to", "listicle", "story"] },
    voice: { type: "string" },
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
