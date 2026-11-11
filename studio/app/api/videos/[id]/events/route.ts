import { getVideo, listEvents } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  let after = Number(req.headers.get("last-event-id") ?? url.searchParams.get("after") ?? 0) || 0;
  const enc = new TextEncoder();
  let timer: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    start(controller) {
      let lastVideo = "";
      const tick = () => {
        const video = getVideo(id);
        if (!video) { clearInterval(timer); controller.close(); return; }
        const events = listEvents(id, after);
        if (events.length) after = events[events.length - 1].id;
        const vj = JSON.stringify(video);
        if (events.length || vj !== lastVideo) {
          lastVideo = vj;
          controller.enqueue(enc.encode(`id: ${after}\ndata: ${JSON.stringify({ video, events })}\n\n`));
        }
      };
      tick();
      timer = setInterval(tick, 1000);
      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() { clearInterval(timer); },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
