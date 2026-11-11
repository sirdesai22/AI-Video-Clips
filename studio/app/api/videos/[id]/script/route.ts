import { scriptAction } from "@/lib/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const r = scriptAction((await ctx.params).id, await req.json().catch(() => ({})));
  return r.ok ? Response.json({ video: r.video }) : Response.json({ error: r.error }, { status: r.status });
}
