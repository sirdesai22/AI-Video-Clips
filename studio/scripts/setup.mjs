import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
for (const d of ["data", "videos"]) fs.mkdirSync(path.join(root, d), { recursive: true });

function check(label, cmd, args) {
  try { execFileSync(cmd, args, { stdio: "pipe", timeout: 60000 }); console.log(`✓ ${label}`); }
  catch { console.log(`✗ ${label}: run \`${cmd} ${args.join(" ")}\` to see why`); }
}
check("Claude Code is installed", "claude", ["--version"]);
check("FFmpeg is installed", "ffmpeg", ["-version"]);
check("Kokoro Python is ready", path.join(root, "..", ".venv-kokoro", "bin", "python"), ["-c", "import kokoro_onnx"]);
console.log("! Claude Code must be logged in for headless use: run `claude` once and use /login if asked.");
console.log("! For music, sign in to HeyGen once: npx hyperframes auth login");

console.log("\nOpen: http://localhost:3000");
