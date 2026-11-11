import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as db from "../../lib/db";
import { withLookDefaults } from "../../lib/look-defaults";
import { buildAction, createVideoAction, scriptAction, videoDetail } from "../../lib/actions";

const script = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/script.json"), "utf8"));

beforeEach(() => db.closeDb());

function withScript() {
  const r = createVideoAction({ input: "https://example.com story" });
  if (!r.ok) throw new Error("create failed");
  const ver = db.addScript(r.video.id, script, null);
  return db.updateVideo(r.video.id, { status: "script_ready", scriptVersion: ver });
}

describe("createVideoAction", () => {
  it("defaults to a reel, explainer, no forced voice, and queues a script job", () => {
    const r = createVideoAction({ input: "a topic about bees" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.video.format).toBe("reel");
    expect(r.video.recipe).toBe("explainer");
    expect(r.video.options.voice).toBeUndefined();
    expect(db.claimNextJob()?.kind).toBe("script");
  });
  it("rejects empty input and unknown formats", () => {
    expect(createVideoAction({ input: " " })).toMatchObject({ ok: false, status: 400 });
    expect(createVideoAction({ input: "abc topic", format: "square" })).toMatchObject({ ok: false, status: 400 });
  });
});

describe("createVideoAction recipes and voice", () => {
  it("rejects unknown recipes, angles and malformed voices", () => {
    expect(createVideoAction({ input: "abc topic", recipe: "nope" })).toMatchObject({ ok: false, status: 400 });
    expect(createVideoAction({ input: "abc topic", options: { angle: "bogus" } })).toMatchObject({ ok: false, status: 400 });
    expect(createVideoAction({ input: "abc topic", options: { voice: "Bad Voice" } })).toMatchObject({ ok: false, status: 400 });
  });
  it("accepts a recipe angle and keeps the chosen voice", () => {
    const r = createVideoAction({ input: "abc topic", recipe: "data-story", options: { angle: "trend", voice: "af_nova" } });
    expect(r).toMatchObject({ ok: true, video: { recipe: "data-story", options: { angle: "trend", voice: "af_nova" } } });
  });
  it("uses a stored default voice only when one is set", () => {
    db.setSetting("default_voice", "bm_george");
    const r = createVideoAction({ input: "abc topic" });
    expect(r).toMatchObject({ ok: true, video: { options: { voice: "bm_george" } } });
  });
});

describe("older scripts without look/concept", () => {
  it("default stored voice skips types without a voice knob", () => {
    db.setSetting("default_voice", "bm_george");
    expect(createVideoAction({ input: "abc topic", recipe: "motion-graphic" })).toMatchObject({ ok: true, video: { options: {} } });
  });
  it("can be edited and saved once seeded with defaults", () => {
    const old = { ...script };
    delete old.look;
    delete old.concept;
    const r = createVideoAction({ input: "https://example.com story" });
    if (!r.ok) throw new Error("create failed");
    const ver = db.addScript(r.video.id, old, null);
    db.updateVideo(r.video.id, { status: "script_ready", scriptVersion: ver });
    expect(videoDetail(r.video.id)?.script?.script.look).toBeUndefined();
    expect(scriptAction(r.video.id, { action: "edit", script: old })).toMatchObject({ ok: false, status: 422 });
    expect(scriptAction(r.video.id, { action: "edit", script: withLookDefaults(old) })).toMatchObject({ ok: true });
  });
});

describe("scriptAction", () => {
  it("approve queues a new build", () => {
    const v = withScript();
    db.claimNextJob();
    const r = scriptAction(v.id, { action: "approve" });
    expect(r).toMatchObject({ ok: true, video: { status: "queued" } });
    const job = db.claimNextJob();
    expect(job?.kind).toBe("build");
    expect(job?.payload).toEqual({ mode: "new" });
  });

  it("edit validates and saves a new version", () => {
    const v = withScript();
    const bad = { ...script, scenes: [{ ...script.scenes[0], spoken: Array(25).fill("w").join(" ") }, ...script.scenes.slice(1)] };
    expect(scriptAction(v.id, { action: "edit", script: bad })).toMatchObject({ ok: false, status: 422 });
    const good = { ...script, title: "Edited" };
    const r = scriptAction(v.id, { action: "edit", script: good });
    expect(r).toMatchObject({ ok: true, video: { scriptVersion: 2, title: "Edited" } });
  });

  it("rewrite queues a script job with the note", () => {
    const v = withScript();
    db.claimNextJob();
    expect(scriptAction(v.id, { action: "rewrite", note: "punchier hook" })).toMatchObject({ ok: true, video: { status: "scripting" } });
    expect(db.claimNextJob()?.payload).toEqual({ note: "punchier hook" });
  });

  it("select switches the current version", () => {
    const v = withScript();
    db.addScript(v.id, { ...script, title: "v2" }, "x");
    expect(scriptAction(v.id, { action: "select", version: 2 })).toMatchObject({ ok: true, video: { scriptVersion: 2 } });
    expect(scriptAction(v.id, { action: "select", version: 9 })).toMatchObject({ ok: false, status: 404 });
  });

  it("refuses actions in the wrong state", () => {
    const v = withScript();
    db.updateVideo(v.id, { status: "building" });
    expect(scriptAction(v.id, { action: "approve" })).toMatchObject({ ok: false, status: 409 });
  });

  it("retry after script_failed queues a fresh script job", () => {
    const v = withScript();
    db.claimNextJob();
    db.updateVideo(v.id, { status: "script_failed" });
    expect(scriptAction(v.id, { action: "retry" })).toMatchObject({ ok: true, video: { status: "scripting" } });
  });
});

describe("buildAction", () => {
  it("revise needs a ready video and a request", () => {
    const v = withScript();
    db.updateVideo(v.id, { status: "ready", sessionId: "s1", renderVersion: 1 });
    expect(buildAction(v.id, { action: "revise", request: "" })).toMatchObject({ ok: false, status: 400 });
    expect(buildAction(v.id, { action: "revise", request: "slower ending" })).toMatchObject({ ok: true, video: { status: "queued" } });
  });

  it("retry works from failed or interrupted", () => {
    const v = withScript();
    db.updateVideo(v.id, { status: "interrupted", sessionId: "s1" });
    expect(buildAction(v.id, { action: "retry" })).toMatchObject({ ok: true });
    db.claimNextJob();
    expect(db.claimNextJob()?.payload).toEqual({ mode: "retry" });
  });
});

describe("videoDetail", () => {
  it("returns the current script, versions and render URLs", () => {
    const v = withScript();
    db.addRender(v.id, { path: "/x/renders/v1.mp4", posterPath: "/x/renders/v1.jpg", durationS: 12 });
    const d = videoDetail(v.id)!;
    expect(d.script?.version).toBe(1);
    expect(d.scripts).toHaveLength(1);
    expect(d.renders[0]).toEqual({ version: 1, url: `/api/media/${v.id}/v1.mp4`, posterUrl: `/api/media/${v.id}/v1.jpg`, durationS: 12 });
    expect(videoDetail("missing")).toBeNull();
  });
});
