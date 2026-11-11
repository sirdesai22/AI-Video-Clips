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
