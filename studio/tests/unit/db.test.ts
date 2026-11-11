import { describe, it, expect, beforeEach } from "vitest";
import * as db from "../../lib/db";

beforeEach(() => db.closeDb());

describe("videos", () => {
  it("creates, reads, lists and updates a video", () => {
    const v = db.createVideo({ format: "reel", input: "a topic", options: { tone: "bold" } });
    expect(v.id).toMatch(/^[0-9a-z]{10}$/);
    expect(v.status).toBe("scripting");
    expect(v.options).toEqual({ tone: "bold" });
    expect(db.getVideo(v.id)?.input).toBe("a topic");
    const u = db.updateVideo(v.id, { status: "script_ready", title: "T", progress: 5 });
    expect(u.status).toBe("script_ready");
    expect(u.title).toBe("T");
    expect(db.listVideos().map((x) => x.id)).toEqual([v.id]);
    expect(db.getVideo("nope")).toBeNull();
  });
});

describe("scripts and renders", () => {
  it("numbers script and render versions per video", () => {
    const v = db.createVideo({ format: "reel", input: "x", options: {} });
    expect(db.addScript(v.id, { a: 1 }, null)).toBe(1);
    expect(db.addScript(v.id, { a: 2 }, "punchier")).toBe(2);
    expect(db.getScript(v.id)?.script).toEqual({ a: 2 });
    expect(db.getScript(v.id, 1)?.script).toEqual({ a: 1 });
    expect(db.listScripts(v.id).map((s) => s.note)).toEqual([null, "punchier"]);
    expect(db.addRender(v.id, { path: "/r/v1.mp4", posterPath: null, durationS: 30 })).toBe(1);
    expect(db.listRenders(v.id)[0].durationS).toBe(30);
  });
});

describe("jobs", () => {
  it("claims queued jobs oldest first, one at a time", () => {
    const v = db.createVideo({ format: "reel", input: "x", options: {} });
    const a = db.enqueueJob(v.id, "script", { note: "n" });
    db.enqueueJob(v.id, "build", { mode: "new" });
    const c1 = db.claimNextJob();
    expect(c1?.id).toBe(a.id);
    expect(c1?.state).toBe("running");
    expect(c1?.payload).toEqual({ note: "n" });
    db.finishJob(a.id, "done");
    expect(db.claimNextJob()?.kind).toBe("build");
    expect(db.claimNextJob()).toBeNull();
  });

  it("marks running jobs interrupted on restart", () => {
    const v = db.createVideo({ format: "reel", input: "x", options: {} });
    db.updateVideo(v.id, { status: "building" });
    db.enqueueJob(v.id, "build", { mode: "new" });
    db.claimNextJob();
    expect(db.markInterrupted()).toBe(1);
    expect(db.getVideo(v.id)?.status).toBe("interrupted");
    expect(db.claimNextJob()).toBeNull();
  });

  it("leaves queued and done jobs untouched on restart", () => {
    const v = db.createVideo({ format: "reel", input: "x", options: {} });
    const done = db.enqueueJob(v.id, "script", {});
    db.claimNextJob();
    db.finishJob(done.id, "done");
    db.enqueueJob(v.id, "build", { mode: "new" });
    expect(db.markInterrupted()).toBe(0);
    expect(db.getVideo(v.id)?.status).toBe("scripting");
    expect(db.claimNextJob()?.kind).toBe("build");
  });

  it("marks an interrupted script job as script_failed", () => {
    const v = db.createVideo({ format: "reel", input: "x", options: {} });
    db.enqueueJob(v.id, "script", {});
    db.claimNextJob();
    db.markInterrupted();
    expect(db.getVideo(v.id)?.status).toBe("script_failed");
  });
});

describe("events and settings", () => {
  it("lists events after an id", () => {
    const v = db.createVideo({ format: "reel", input: "x", options: {} });
    db.addEvent(v.id, "log", "one");
    db.addEvent(v.id, "stage", "voice");
    const all = db.listEvents(v.id);
    expect(all.map((e) => e.text)).toEqual(["one", "voice"]);
    expect(db.listEvents(v.id, all[0].id).map((e) => e.text)).toEqual(["voice"]);
  });

  it("stores settings", () => {
    expect(db.getSetting("k")).toBeNull();
    db.setSetting("k", "v");
    db.setSetting("k", "w");
    expect(db.getSetting("k")).toBe("w");
  });
});
