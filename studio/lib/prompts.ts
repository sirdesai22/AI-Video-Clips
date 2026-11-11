import fs from "node:fs";
import path from "node:path";
import { promptsDir } from "./paths";

export function renderPrompt(name: string, vars: Record<string, string>): string {
  const raw = fs.readFileSync(path.join(promptsDir(), `${name}.md`), "utf8");
  return raw.replace(/\{\{(\w+)\}\}/g, (m, k: string) => (Object.hasOwn(vars, k) ? vars[k] : m));
}
