import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as db from "../../lib/db";
import { processNext } from "../../worker/index";

beforeEach(() => {
  db.closeDb();
  process.env.AGENT = "fake";
  process.env.VIDEOS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "rs-videos-"));
});
afterEach(() => { delete process.env.AGENT; });

describe("processNext", () => {
  it("returns false when the queue is empty", async () => {
    expect(await processNext()).toBe(false);
  });

  it("runs a script job then a build job end to end", async () => {
    const v = db.createVideo({ format: "reel", input: "topic", options: {} });
    db.enqueueJob(v.id, "script", {});
    expect(await processNext()).toBe(true);
    expect(db.getVideo(v.id)!.status).toBe("script_ready");
    db.updateVideo(v.id, { status: "queued" });
    db.enqueueJob(v.id, "build", { mode: "new" });
    expect(await processNext()).toBe(true);
    expect(db.getVideo(v.id)!.status).toBe("ready");
    expect(await processNext()).toBe(false);
  });
});

describe("worker safety", () => {
  it("kills a stale agent process group and clears the pid file", async () => {
    const { spawn } = await import("node:child_process");
    const { cleanupStaleAgent } = await import("../../worker/index");
    const child = spawn("sleep", ["600"], { detached: true, stdio: "ignore" });
    child.unref();
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rs-pid-")), "agent.pid");
    fs.writeFileSync(file, String(child.pid));
    const exited = new Promise((r) => child.on("exit", r));
    expect(cleanupStaleAgent(file, () => "sleep 600", /sleep/)).toBe(true);
    await exited;
    expect(fs.existsSync(file)).toBe(false);
  });

  it("leaves unrelated processes alone", async () => {
    const { cleanupStaleAgent } = await import("../../worker/index");
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rs-pid-")), "agent.pid");
    fs.writeFileSync(file, String(process.pid));
    expect(cleanupStaleAgent(file, () => "vim notes.txt")).toBe(false);
    expect(fs.existsSync(file)).toBe(false);
  });

  it("refuses a second worker while the first is alive", async () => {
    const { acquireWorkerLock, releaseWorkerLock } = await import("../../worker/index");
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rs-lock-")), "worker.pid");
    fs.writeFileSync(file, String(process.ppid)); // a live process that isn't us
    expect(acquireWorkerLock(file)).toBe(false);
    fs.writeFileSync(file, "999999");
    expect(acquireWorkerLock(file)).toBe(true);
    expect(fs.readFileSync(file, "utf8")).toBe(String(process.pid));
    releaseWorkerLock(file);
    expect(fs.existsSync(file)).toBe(false);
  });
});
