import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
let cache: { at: number; value: "signed_in" | "signed_out" | "unknown" } | null = null;

export async function heygenStatus(force = false): Promise<"signed_in" | "signed_out" | "unknown"> {
  if (!force && cache && Date.now() - cache.at < 60_000) return cache.value;
  let value: "signed_in" | "signed_out" | "unknown" = "unknown";
  try {
    const { stdout, stderr } = await run("npx", ["--yes", "hyperframes", "auth", "status"], { timeout: 60_000 });
    const out = `${stdout}\n${stderr}`;
    value = /not signed in/i.test(out) ? "signed_out" : /signed in/i.test(out) ? "signed_in" : "unknown";
  } catch (e) {
    const out = String((e as { stdout?: string }).stdout ?? "");
    value = /not signed in/i.test(out) ? "signed_out" : "unknown";
  }
  cache = { at: Date.now(), value };
  return value;
}
