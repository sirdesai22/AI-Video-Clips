import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as db from "../../lib/db";
import { runScriptJob, buildScriptPrompt } from "../../worker/script-job";

beforeEach(() => {
  db.closeDb();
  process.env.AGENT = "fake";
  process.env.VIDEOS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "rs-videos-"));
});
afterEach(() => { delete process.env.AGENT; for (const k of ["FAKE_FAIL", "FAKE_INVALID", "FAKE_GARBAGE", "FAKE_HANG"]) delete process.env[k]; });

function newVideo() {
  const v = db.createVideo({ format: "reel", input: "https://www.highagency.com/", options: { tone: "bold" } });
  return v;
}

describe("buildScriptPrompt", () => {
  it("includes format rules, options, input, previous script and note", () => {
    const v = newVideo();
    const p = buildScriptPrompt(v, { title: "Old" } as never, "punchier", ["scenes.0.spoken: 20 words, max 19"]);
    expect(p).toContain("Vertical 9:16 reel");
    expect(p).toContain("tone: bold");
    expect(p).toContain("https://www.highagency.com/");
    expect(p).toContain("REWRITE NOTE: punchier");
    expect(p).toContain("\"title\": \"Old\"");
    expect(p).toContain("scenes.0.spoken: 20 words, max 19");
    expect(p).toContain("\"am_michael\"");
    expect(p).toContain("do not invoke any skills");
  });
});

describe("runScriptJob", () => {
  it("stores version 1 and marks the video script_ready", async () => {
    const v = newVideo();
    const job = db.enqueueJob(v.id, "script", {});
    await runScriptJob(job);
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("script_ready");
    expect(after.scriptVersion).toBe(1);
    expect(after.title).toBe("The 59 seconds that made flight");
  });

  it("stores a rewrite as the next version with its note", async () => {
    const v = newVideo();
    await runScriptJob(db.enqueueJob(v.id, "script", {}));
    await runScriptJob(db.enqueueJob(v.id, "script", { note: "funnier" }));
    const after = db.getVideo(v.id)!;
    expect(after.scriptVersion).toBe(2);
    expect(db.getScript(v.id, 2)?.note).toBe("funnier");
    expect(after.title).toContain("(rewritten)");
  });

  it("marks script_failed when the agent fails", async () => {
    process.env.FAKE_FAIL = "1";
    const v = newVideo();
    await runScriptJob(db.enqueueJob(v.id, "script", {}));
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("script_failed");
    expect(after.error).toMatch(/fake failure/);
  });

  it("retries once after an invalid script and then succeeds", async () => {
    process.env.FAKE_INVALID = "once";
    const v = newVideo();
    await runScriptJob(db.enqueueJob(v.id, "script", {}));
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("script_ready");
    expect(after.scriptVersion).toBe(1);
    expect(db.listEvents(v.id).some((e) => e.text.includes("attempt 1 invalid"))).toBe(true);
  });

  it("fails when the script stays invalid", async () => {
    process.env.FAKE_INVALID = "always";
    const v = newVideo();
    await runScriptJob(db.enqueueJob(v.id, "script", {}));
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("script_failed");
    expect(after.error).toContain("scenes.0.spoken");
  });

  it("fails on unparseable output", async () => {
    process.env.FAKE_GARBAGE = "1";
    const v = newVideo();
    await runScriptJob(db.enqueueJob(v.id, "script", {}));
    expect(db.getVideo(v.id)!.status).toBe("script_failed");
  });

  it("fails on timeout", async () => {
    process.env.FAKE_HANG = "1";
    const v = newVideo();
    await runScriptJob(db.enqueueJob(v.id, "script", {}), { timeoutMs: 500 });
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("script_failed");
    expect(after.error).toContain("timed out");
  });
});
