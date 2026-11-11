import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as db from "../../lib/db";
import { projectDir, rendersDir } from "../../lib/paths";
import { runBuildJob, prepareProject } from "../../worker/build-job";

const script = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/script.json"), "utf8"));
let tmp: string;

beforeEach(() => {
  db.closeDb();
  process.env.AGENT = "fake";
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rs-videos-"));
  process.env.VIDEOS_DIR = tmp;
});
afterEach(() => {
  db.closeDb();
  delete process.env.AGENT;
  delete process.env.FAKE_FAIL;
  delete process.env.FAKE_HANG;
  delete process.env.VIDEOS_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

function readyVideo() {
  const v = db.createVideo({ format: "reel", input: "x", options: {} });
  const ver = db.addScript(v.id, script, null);
  return db.updateVideo(v.id, { status: "queued", scriptVersion: ver });
}

describe("prepareProject", () => {
  it("writes SCRIPT.json and a reel BRIEF.md", async () => {
    const v = readyVideo();
    const dir = await prepareProject(v, script);
    expect(dir).toBe(projectDir(v.id));
    expect(JSON.parse(fs.readFileSync(path.join(dir, "SCRIPT.json"), "utf8")).title).toBe(script.title);
    const brief = fs.readFileSync(path.join(dir, "BRIEF.md"), "utf8");
    expect(brief).toContain("1080x1920");
    expect(brief).toContain("am_michael");
    expect(brief).toContain("renders/v1.mp4");
  });
});

describe("runBuildJob", () => {
  it("runs the agent, tracks stages and records render v1", async () => {
    const v = readyVideo();
    await runBuildJob(db.enqueueJob(v.id, "build", { mode: "new" }));
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("ready");
    expect(after.progress).toBe(100);
    expect(after.sessionId).toBe("fake-session");
    expect(after.renderVersion).toBe(1);
    const r = db.listRenders(v.id)[0];
    expect(r.path).toBe(path.join(rendersDir(v.id), "v1.mp4"));
    expect(r.durationS).toBeGreaterThan(1);
    expect(fs.existsSync(r.posterPath!)).toBe(true);
    const stages = db.listEvents(v.id).filter((e) => e.kind === "stage").map((e) => e.text);
    expect(stages).toEqual(["voice", "music", "look", "scenes", "check", "render", "done"]);
  });

  it("revises into render v2 using the same session", async () => {
    const v = readyVideo();
    await runBuildJob(db.enqueueJob(v.id, "build", { mode: "new" }));
    await runBuildJob(db.enqueueJob(v.id, "build", { mode: "revise", request: "slower ending" }));
    expect(db.getVideo(v.id)!.renderVersion).toBe(2);
    expect(fs.existsSync(path.join(rendersDir(v.id), "v2.mp4"))).toBe(true);
  });

  it("marks failed with the agent's message", async () => {
    process.env.FAKE_FAIL = "1";
    const v = readyVideo();
    await runBuildJob(db.enqueueJob(v.id, "build", { mode: "new" }));
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("failed");
    expect(after.error).toMatch(/fake failure/);
  });

  it("stops a hung agent and reports the actual timeout", async () => {
    process.env.FAKE_HANG = "1";
    const v = readyVideo();
    await runBuildJob(db.enqueueJob(v.id, "build", { mode: "new" }), { timeoutMs: 300 });
    const after = db.getVideo(v.id)!;
    expect(after.status).toBe("failed");
    expect(after.error).toBe("Took longer than 1 minute and was stopped");
  }, 15000);
});
