"use client";
import { useState } from "react";
import { BottomBar, Disclosure } from "./ui";
import LogList from "./LogList";
import type { Video, VideoEvent } from "@/lib/types";

export default function FailedView({ video, events, onChange }: { video: Video; events: VideoEvent[]; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const isScript = video.status === "script_failed";
  async function retry() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/videos/${video.id}/${isScript ? "script" : "build"}`, { method: "POST", body: JSON.stringify({ action: "retry" }) });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMsg(d.error ?? "That didn't work.");
        return;
      }
      await onChange();
    } catch {
      setMsg("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-6">
      <h1 className="text-xl font-semibold">
        {isScript ? "Couldn't write a script" : video.status === "interrupted" ? "This video was interrupted" : "This video didn't finish"}
      </h1>
      <p className="text-sm text-muted">{video.error ?? "Something went wrong."}</p>
      {!isScript && <p className="text-sm text-muted">Retry picks up where it stopped; finished parts are kept.</p>}
      <Disclosure summary="Show details"><LogList events={events} /></Disclosure>
      {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
      <BottomBar><button className="btn-primary" disabled={busy} onClick={retry}>Try again</button></BottomBar>
    </div>
  );
}
