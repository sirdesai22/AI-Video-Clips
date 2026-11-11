import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const envFile = path.join(root, ".env.local");
let env = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
if (!/^SESSION_SECRET=.{32,}$/m.test(env)) {
  env += `${env && !env.endsWith("\n") ? "\n" : ""}SESSION_SECRET=${crypto.randomBytes(32).toString("hex")}\n`;
  fs.writeFileSync(envFile, env);
  console.log("✓ wrote SESSION_SECRET to .env.local");
}
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

const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal);
console.log(`\nOpen on your phone: http://${os.hostname()}:3000` + (ips[0] ? `  (or http://${ips[0].address}:3000)` : ""));
