"use client";
import { useState } from "react";
import { BottomBar, Disclosure } from "./ui";
import LogList from "./LogList";
import type { VideoDetail } from "@/lib/actions";
import type { VideoEvent } from "@/lib/types";

export default function ResultView({ detail, events, onChange }: { detail: VideoDetail; events: VideoEvent[]; onChange: () => Promise<void> }) {
  const { video, renders, script } = detail;
  const [selected, setSelected] = useState<number | null>(null);
  const render = renders.find((r) => r.version === selected) ?? renders.at(-1);
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!render) return null;
  const fileName = `${(video.title ?? "video").replace(/[^\w-]+/g, "-").toLowerCase()}-v${render.version}.mp4`;

  async function revise() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/videos/${video.id}/build`, { method: "POST", body: JSON.stringify({ action: "revise", request }) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error ?? "That didn't work."); return; }
      setRequest("");
      await onChange();
    } catch {
      setMsg("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function openEditor() {
    setMsg("Starting the editor on your Mac…");
    try {
      const r = await fetch(`/api/videos/${video.id}/editor`, { method: "POST" });
      const d = await r.json();
      if (d.url) { window.open(d.url, "_blank"); setMsg(`Editor running at ${d.url}.`); }
      else setMsg(d.error ?? "Couldn't start the editor.");
    } catch {
      setMsg("Couldn't start the editor.");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
      <video key={render.url} src={render.url} poster={render.posterUrl ?? undefined} controls playsInline
        className={`rounded-2xl bg-black ${video.format === "reel" ? "mx-auto aspect-[9/16] w-full max-w-[360px]" : "aspect-video w-full md:w-[min(60vw,640px)]"}`} />
      <div className="flex min-w-0 flex-col gap-4">
        <h1 className="text-xl font-semibold">{video.title}</h1>

        <a className="btn-secondary text-center" href={render.url} download={fileName}>Download</a>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Change something</span>
          <textarea className="field" rows={2} placeholder="e.g. slower ending, different music, bigger captions"
            value={request} onChange={(e) => setRequest(e.target.value)} />
        </label>
        {msg && <p className="text-sm text-muted">{msg}</p>}
        <BottomBar>
          <button className="btn-primary" disabled={busy || request.trim().length < 3} onClick={revise}>
            {busy ? "Sending…" : "Make this change"}
          </button>
        </BottomBar>

        <Disclosure summary="Details">
          <div className="flex flex-col gap-3 text-sm">
            {renders.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {renders.map((r) => (
                  <button key={r.version} className="btn-secondary" disabled={r.version === render.version}
                    onClick={() => setSelected(r.version)}>v{r.version} · {Math.round(r.durationS)} s</button>
                ))}
              </div>
            )}
            {script && (
              <ol className="list-decimal pl-5">{script.script.scenes.map((s, i) => <li key={i}>{s.spoken}</li>)}</ol>
            )}
            <button className="btn-secondary" onClick={openEditor}>Open in editor (on your Mac)</button>
            <LogList events={events} />
          </div>
        </Disclosure>
      </div>
    </div>
  );
}
