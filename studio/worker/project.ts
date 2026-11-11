import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { projectDir, skillsSource, videoDir } from "../lib/paths";
import { renderPrompt } from "../lib/prompts";
import type { Script } from "../lib/script-schema";
import type { Video } from "../lib/types";

const run = promisify(execFile);

export const SIZES = { reel: { width: 1080, height: 1920 }, explainer: { width: 1920, height: 1080 } } as const;

/** Symlink every installed skill into <dir>/.claude/skills with absolute targets. */
export function linkSkills(dir: string): void {
  const src = skillsSource();
  if (!fs.existsSync(src)) return;
  const dest = path.join(dir, ".claude", "skills");
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const link = path.join(dest, name);
    try { fs.lstatSync(link); continue; } catch { /* missing: create it */ }
    fs.symlinkSync(path.join(src, name), link);
  }
}

export async function prepareProject(v: Video, script: Script, renderRel: string): Promise<string> {
  const dir = projectDir(v.id);
  if (!fs.existsSync(path.join(dir, "index.html"))) {
    if (process.env.AGENT === "fake") {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), "<!doctype html>");
    } else {
      fs.mkdirSync(videoDir(v.id), { recursive: true });
      await run("npx", ["--yes", "hyperframes", "init", "project", "--skip-skills", "--skill=hyperframes"],
        { cwd: videoDir(v.id), timeout: 180000 });
    }
  }
  linkSkills(dir);
  fs.writeFileSync(path.join(dir, "SCRIPT.json"), JSON.stringify(script, null, 2));
  const size = SIZES[v.format];
  fs.writeFileSync(path.join(dir, "BRIEF.md"), renderPrompt("brief", {
    formatName: v.format === "reel" ? "Reel (vertical 9:16)" : "Explainer (landscape 16:9)",
    width: String(size.width),
    height: String(size.height),
    voice: script.voice,
    captionRule: v.format === "reel"
      ? "Captions: burned-in caption track for every spoken word (registry caption blocks), keywords in the accent colour, inside the 80% title-safe area and clear of the bottom 15% (app UI)."
      : "Captions: none (the on-screen text carries the words).",
    renderPath: renderRel,
  }));
  return dir;
}
