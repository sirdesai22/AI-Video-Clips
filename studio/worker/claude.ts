import { spawn, type ChildProcess } from "node:child_process";
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
    let stdout = "";
    let stderr = "";
    let buf = "";
    let timedOut = false;
    let done = false;

    let child: ChildProcess;
    try {
      child = spawn(cmd, [...preArgs, "-p", ...o.args], {
        cwd: o.cwd,
        env: { ...process.env, ...o.env },
        stdio: ["pipe", "pipe", "pipe"],
        detached: true,
      });
    } catch (e) {
      resolve({ code: null, timedOut: false, stdout: "", stderr: String(e) });
      return;
    }

    const killGroup = (sig: NodeJS.Signals) => {
      try { process.kill(-child.pid!, sig); } catch { /* already gone */ }
    };
    const onParentExit = () => killGroup("SIGKILL");
    process.once("exit", onParentExit);

    const emit = (line: string) => {
      try { o.onLine?.(line); } catch (e) { stderr += `onLine error: ${String(e)}\n`; }
    };

    let exitCode: number | null = null;
    let graceTimer: NodeJS.Timeout | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(graceTimer);
      process.removeListener("exit", onParentExit);
      child.stdout?.destroy();
      child.stderr?.destroy();
      if (buf.trim()) emit(buf.trim());
      buf = "";
      resolve({ code: exitCode, timedOut, stdout, stderr });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killGroup("SIGTERM");
      setTimeout(() => killGroup("SIGKILL"), 5000).unref();
    }, o.timeoutMs);

    child.stdout!.setEncoding("utf8");
    child.stderr!.setEncoding("utf8");
    child.stdout!.on("data", (s: string) => {
      stdout += s;
      buf += s;
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) emit(line);
      }
    });
    child.stderr!.on("data", (s: string) => { stderr += s; });
    child.on("error", (err) => {
      stderr += String(err);
      finish();
    });
    child.on("exit", (code) => {
      exitCode = code;
      // A grandchild holding the pipes can keep "close" from firing.
      graceTimer = setTimeout(finish, 2000);
    });
    child.on("close", (code) => {
      if (exitCode === null) exitCode = code;
      finish();
    });
    child.stdin!.on("error", () => {});
    child.stdin!.end(o.prompt);
  });
}
