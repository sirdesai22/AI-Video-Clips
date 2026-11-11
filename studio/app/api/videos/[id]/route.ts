import { videoDetail } from "@/lib/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const d = videoDetail((await ctx.params).id);
  return d ? Response.json(d) : Response.json({ error: "Not found" }, { status: 404 });
}
