import { z } from "zod";
import {
  addScript, enqueueJob, getScript, getSetting, getVideo, listRenders, listScripts, updateVideo, createVideo,
} from "./db";
import { validateScript, type Script } from "./script-schema";
import type { Video } from "./types";

export type ActionResult = { ok: true; video: Video } | { ok: false; error: string; status: number };
const fail = (error: string, status: number): ActionResult => ({ ok: false, error, status });

const CreateSchema = z.object({
  format: z.enum(["reel", "explainer"]).default("reel"),
  input: z.string().trim().min(3, "Add a link, story or topic").max(20000),
  options: z.object({
    tone: z.string().max(200).optional(),
    length: z.string().max(100).optional(),
    audience: z.string().max(200).optional(),
    voice: z.string().max(40).optional(),
    exactWording: z.string().max(2000).optional(),
    cta: z.string().max(300).optional(),
  }).default({}),
});

export function createVideoAction(body: unknown): ActionResult {
  const p = CreateSchema.safeParse(body);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid input", 400);
  const options = Object.fromEntries(Object.entries(p.data.options).filter(([, val]) => val && String(val).trim()));
  options.voice = options.voice || getSetting("default_voice") || "am_michael";
  const video = createVideo({ format: p.data.format, input: p.data.input, options });
  enqueueJob(video.id, "script", {});
  return { ok: true, video };
}

const ScriptActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("edit"), script: z.unknown() }),
  z.object({ action: z.literal("rewrite"), note: z.string().max(1000).default("") }),
  z.object({ action: z.literal("select"), version: z.number().int().positive() }),
  z.object({ action: z.literal("retry") }),
]);

export function scriptAction(id: string, body: unknown): ActionResult {
  const v = getVideo(id);
  if (!v) return fail("Video not found", 404);
  const p = ScriptActionSchema.safeParse(body);
  if (!p.success) return fail("Unknown action", 400);
  const a = p.data;
  if (a.action === "retry") {
    if (v.status !== "script_failed") return fail("Nothing to retry", 409);
    enqueueJob(v.id, "script", {});
    return { ok: true, video: updateVideo(v.id, { status: "scripting", error: null }) };
  }
  if (v.status !== "script_ready") return fail("The script can't be changed right now", 409);
  switch (a.action) {
    case "approve":
      enqueueJob(v.id, "build", { mode: "new" });
      return { ok: true, video: updateVideo(v.id, { status: "queued", stage: null, progress: 0 }) };
    case "edit": {
      const check = validateScript(a.script, v.format);
      if (!check.ok) return fail(check.errors.join("; "), 422);
      const version = addScript(v.id, check.script, "edited");
      return { ok: true, video: updateVideo(v.id, { scriptVersion: version, title: check.script.title }) };
    }
    case "rewrite":
      enqueueJob(v.id, "script", { note: a.note.trim() || "make it better" });
      return { ok: true, video: updateVideo(v.id, { status: "scripting" }) };
    case "select": {
      const row = getScript(v.id, a.version);
      if (!row) return fail("No such version", 404);
      return { ok: true, video: updateVideo(v.id, { scriptVersion: a.version, title: (row.script as Script).title }) };
    }
  }
}

const BuildActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revise"), request: z.string().trim().max(2000) }),
  z.object({ action: z.literal("retry") }),
]);

export function buildAction(id: string, body: unknown): ActionResult {
  const v = getVideo(id);
  if (!v) return fail("Video not found", 404);
  const p = BuildActionSchema.safeParse(body);
  if (!p.success) return fail("Unknown action", 400);
  if (p.data.action === "revise") {
    if (v.status !== "ready") return fail("The video isn't ready yet", 409);
    if (p.data.request.length < 3) return fail("Say what to change", 400);
    enqueueJob(v.id, "build", { mode: "revise", request: p.data.request });
    return { ok: true, video: updateVideo(v.id, { status: "queued", progress: 0, stage: null }) };
  }
  if (v.status !== "failed" && v.status !== "interrupted") return fail("Nothing to retry", 409);
  enqueueJob(v.id, "build", { mode: v.sessionId ? "retry" : "new" });
  return { ok: true, video: updateVideo(v.id, { status: "queued", error: null }) };
}

export interface VideoDetail {
  video: Video;
  script: { version: number; script: Script; note: string | null } | null;
  scripts: { version: number; note: string | null; createdAt: string }[];
  renders: { version: number; url: string; posterUrl: string | null; durationS: number }[];
}

export function videoDetail(id: string): VideoDetail | null {
  const video = getVideo(id);
  if (!video) return null;
  const row = video.scriptVersion ? getScript(id, video.scriptVersion) : null;
  return {
    video,
    script: row ? { version: row.version, script: row.script as Script, note: row.note } : null,
    scripts: listScripts(id).map(({ version, note, createdAt }) => ({ version, note, createdAt })),
    renders: listRenders(id).map((r) => ({
      version: r.version,
      url: `/api/media/${id}/v${r.version}.mp4`,
      posterUrl: r.posterPath ? `/api/media/${id}/v${r.version}.jpg` : null,
      durationS: r.durationS,
    })),
  };
}
