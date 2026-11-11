import { getSetting, setSetting } from "@/lib/db";
import { heygenStatus } from "@/lib/heygen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const force = q.get("recheck") === "1";
  return Response.json({
    heygen: q.get("heygen") === "0" ? "unknown" : await heygenStatus(force),
    defaultVoice: getSetting("default_voice") ?? "am_michael",
    defaultFormat: getSetting("default_format") ?? "reel",
    model: getSetting("model") ?? "",
  });
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (b.defaultVoice) setSetting("default_voice", b.defaultVoice);
  if (b.defaultFormat === "reel" || b.defaultFormat === "explainer") setSetting("default_format", b.defaultFormat);
  if (typeof b.model === "string") setSetting("model", b.model.trim());
  return Response.json({ ok: true });
}
