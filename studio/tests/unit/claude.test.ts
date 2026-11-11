import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runClaude, claudeCommand, modelArgs } from "../../worker/claude";
import { closeDb, setSetting } from "../../lib/db";

let dir: string;
beforeEach(() => {
  closeDb();
  process.env.AGENT = "fake";
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "rs-claude-"));
});
afterEach(() => {
  delete process.env.AGENT;
  delete process.env.FAKE_HANG;
  delete process.env.FAKE_GRANDCHILD;
  delete process.env.FAKE_FAIL;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("claudeCommand", () => {
  it("uses node + the fake script when AGENT=fake", () => {
    const c = claudeCommand();
    expect(c.cmd).toBe(process.execPath);
    expect(c.preArgs[0]).toMatch(/fake-claude\.mjs$/);
  });
  it("uses claude otherwise", () => {
    delete process.env.AGENT;
    expect(claudeCommand()).toEqual({ cmd: "claude", preArgs: [] });
  });
});

describe("runClaude", () => {
  it("streams lines and copies the render when RENDER_PATH is set", async () => {
    const lines: string[] = [];
    const render = path.join(dir, "renders", "v1.mp4");
    const r = await runClaude({
      cwd: dir, prompt: "build", args: ["--output-format", "stream-json"], timeoutMs: 20000,
      env: { RENDER_PATH: render }, onLine: (l) => lines.push(l),
    });
    expect(r.code).toBe(0);
    expect(r.timedOut).toBe(false);
    expect(lines).toHaveLength(9);
    expect(fs.existsSync(render)).toBe(true);
  });

  it("returns the structured script in json mode", async () => {
    const r = await runClaude({ cwd: dir, prompt: "x", args: ["--output-format", "json", "--json-schema", "{}"], timeoutMs: 20000 });
    expect(JSON.parse(r.stdout).structured_output.title).toBeTruthy();
  });

  it("kills the process on timeout", async () => {
    process.env.FAKE_HANG = "1";
    const r = await runClaude({ cwd: dir, prompt: "x", args: [], timeoutMs: 500 });
    expect(r.timedOut).toBe(true);
    const pid = Number(/pid:(\d+)/.exec(r.stderr)![1]);
    expect(() => process.kill(pid, 0)).toThrow();
  });

  it("resolves on timeout even when a grandchild holds the pipes", async () => {
    process.env.FAKE_GRANDCHILD = "1";
    const t0 = Date.now();
    const r = await runClaude({ cwd: dir, prompt: "x", args: [], timeoutMs: 500 });
    expect(r.timedOut).toBe(true);
    expect(Date.now() - t0).toBeLessThan(8000);
  });

  it("survives an onLine that throws", async () => {
    const r = await runClaude({
      cwd: dir, prompt: "build", args: ["--output-format", "stream-json"], timeoutMs: 20000,
      onLine: () => { throw new Error("boom"); },
    });
    expect(r.code).toBe(0);
  });

  it("reports a non-zero exit code on failure", async () => {
    process.env.FAKE_FAIL = "1";
    const r = await runClaude({ cwd: dir, prompt: "x", args: [], timeoutMs: 20000 });
    expect(r.code).not.toBe(0);
    expect(r.timedOut).toBe(false);
  });
});

describe("modelArgs", () => {
  it("passes the model setting when set", () => {
    expect(modelArgs()).toEqual([]);
    setSetting("model", "sonnet");
    expect(modelArgs()).toEqual(["--model", "sonnet"]);
  });
});
