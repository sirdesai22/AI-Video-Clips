import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import { projectDir } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const run = promisify(execFile);

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = (await ctx.params).id;
  if (!/^[0-9a-z]{10}$/.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const dir = projectDir(id);
  if (!fs.existsSync(dir)) return Response.json({ error: "No project yet" }, { status: 404 });
  try {
    const { stdout } = await run("npx", ["--yes", "hyperframes", "preview", "--background"], { cwd: dir, timeout: 120_000 });
    const url = /Server\s+(http:\/\/\S+)/.exec(stdout)?.[1] ?? null;
    return Response.json({ url });
  } catch (e) {
    return Response.json({ error: String(e).slice(0, 300) }, { status: 500 });
  }
}
