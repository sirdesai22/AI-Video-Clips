#!/usr/bin/env node
// Stands in for `claude` when AGENT=fake. Reads the prompt from stdin like `claude -p`.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.stderr.write(`pid:${process.pid}\n`);
let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;

if (process.env.FAKE_GRANDCHILD === "1") { spawn("sleep", ["600"], { stdio: "inherit" }); await sleep(600000); }
if (process.env.FAKE_HANG === "1") { await sleep(600000); }
if (process.env.FAKE_FAIL === "1") {
  console.log(JSON.stringify({ type: "result", subtype: "error", is_error: true, result: "fake failure", session_id: "fake-session" }));
  process.exit(1);
}

if (args.includes("--json-schema")) {
  const script = JSON.parse(fs.readFileSync(path.join(here, "script.json"), "utf8"));
  if (process.env.FAKE_GARBAGE === "1") { console.log("not json"); process.exit(0); }
  const marker = path.join(process.cwd(), ".fake-invalid-once");
  const mode = process.env.FAKE_INVALID;
  if (mode === "always" || (mode === "once" && !fs.existsSync(marker))) {
    if (mode === "once") fs.writeFileSync(marker, "1");
    script.scenes[0].spoken = Array.from({ length: 25 }, (_, i) => `w${i}`).join(" ");
  }
  if (prompt.includes("REWRITE NOTE")) script.title = script.title + " (rewritten)";
  console.log(JSON.stringify({ type: "result", subtype: "success", is_error: false, session_id: "fake-session", result: JSON.stringify(script), structured_output: script }));
  process.exit(0);
}

fs.appendFileSync(path.join(process.cwd(), ".fake-calls.jsonl"), JSON.stringify({ argv: args, prompt }) + "\n");
const delay = Number(process.env.FAKE_DELAY_MS ?? 0);
for (const line of fs.readFileSync(path.join(here, "build-stream.jsonl"), "utf8").split("\n").filter(Boolean)) {
  if (line.includes('"type":"result"') && process.env.RENDER_PATH) {
    fs.mkdirSync(path.dirname(process.env.RENDER_PATH), { recursive: true });
    fs.copyFileSync(path.join(here, "sample.mp4"), process.env.RENDER_PATH);
  }
  console.log(line);
  if (delay) await sleep(delay);
}
