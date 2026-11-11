import { spawn } from "node:child_process";
import path from "node:path";
import { fixturesDir } from "../lib/paths";
import { getSetting } from "../lib/db";

export interface RunOptions {
  cwd: string;
  prompt: string;
  args: string[];
  env?: Record<string, string>;
  timeoutMs: number;
  onLine?: (line: string) => void;
}

export interface RunResult { code: number | null; timedOut: boolean; stdout: string; stderr: string }

export function claudeCommand(): { cmd: string; preArgs: string[] } {
  if (process.env.AGENT === "fake") {
    return { cmd: process.execPath, preArgs: [path.join(fixturesDir(), "fake-claude.mjs")] };
  }
  return { cmd: process.env.CLAUDE_BIN ?? "claude", preArgs: [] };
}

export function modelArgs(): string[] {
  const m = getSetting("model");
  return m ? ["--model", m] : [];
}

/** Runs `claude -p <args>` with the prompt on stdin. Never rejects. */
export function runClaude(o: RunOptions): Promise<RunResult> {
  return new Promise((resolve) => {
    const { cmd, preArgs } = claudeCommand();
    const child = spawn(cmd, [...preArgs, "-p", ...o.args], {
      cwd: o.cwd,
      env: { ...process.env, ...o.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let buf = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000).unref();
    }, o.timeoutMs);

    child.stdout.on("data", (d: Buffer) => {
      const s = d.toString();
      stdout += s;
      buf += s;
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) o.onLine?.(line);
      }
    });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: null, timedOut, stdout, stderr: stderr + String(err) });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (buf.trim()) o.onLine?.(buf.trim());
      resolve({ code, timedOut, stdout, stderr });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(o.prompt);
  });
}
