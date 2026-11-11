import { createVideoAction } from "@/lib/actions";
import { listVideos, listRenders } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const videos = listVideos(30).map((v) => {
    const last = listRenders(v.id).at(-1);
    return { ...v, posterUrl: last?.posterPath ? `/api/media/${v.id}/v${last.version}.jpg` : null };
  });
  return Response.json({ videos });
}

export async function POST(req: Request) {
  const r = createVideoAction(await req.json().catch(() => ({})));
  return r.ok ? Response.json({ video: r.video }, { status: 201 }) : Response.json({ error: r.error }, { status: r.status });
}
