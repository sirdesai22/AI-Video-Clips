import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { rendersDir } from "@/lib/paths";
import { parseRange } from "@/lib/range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await ctx.params;
  if (!/^[0-9a-z]{10}$/.test(id) || !/^v\d+\.(mp4|jpg)$/.test(file)) return new Response("Not found", { status: 404 });
  const p = path.join(rendersDir(id), file);
  if (!fs.existsSync(p)) return new Response("Not found", { status: 404 });
  const size = fs.statSync(p).size;
  const type = file.endsWith(".mp4") ? "video/mp4" : "image/jpeg";
  const range = parseRange(req.headers.get("range"), size);
  if (range === "invalid") return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" };
  if (!range) {
    headers["Content-Length"] = String(size);
    return new Response(Readable.toWeb(fs.createReadStream(p)) as ReadableStream, { headers });
  }
  headers["Content-Length"] = String(range.end - range.start + 1);
  headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
  return new Response(Readable.toWeb(fs.createReadStream(p, range)) as ReadableStream, { status: 206, headers });
}
