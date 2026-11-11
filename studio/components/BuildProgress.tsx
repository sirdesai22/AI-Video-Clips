"use client";
import { useEffect, useState } from "react";
import { Disclosure } from "./ui";
import LogList from "./LogList";
import { stageLabel } from "@/lib/stages";
import type { Video, VideoEvent } from "@/lib/types";

export default function BuildProgress({ video, events, scenes }: { video: Video; events: VideoEvent[]; scenes: string[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const started = new Date(video.updatedAt).getTime();
  const lastStart = events.findLast((e) => e.kind === "log" && e.text.startsWith("build "));
  const since = lastStart ? new Date(lastStart.ts).getTime() : started;
  const secs = Math.max(0, Math.round((now - since) / 1000));
  const pct = video.status === "queued" ? 0 : video.progress;
  const label = video.status === "queued" ? "Waiting for the previous video" :
    video.status === "scripting" ? "Writing the script" : stageLabel(video.stage ?? "");
  const r = 54;
  const c = 2 * Math.PI * r;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-6">
      <svg width="160" height="160" viewBox="0 0 128 128" role="img" aria-label={`${pct}% done`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 64 64)" />
        <text x="64" y="70" textAnchor="middle" fontSize="22" fontWeight="600" fill="currentColor">{pct}%</text>
      </svg>
      <div className="text-center">
        <p className="text-lg font-semibold">{label}…</p>
        <p className="text-sm text-muted">{video.status === "queued" ? "" : `${Math.floor(secs / 60)}m ${secs % 60}s · `}You can close this page; we&apos;ll keep going.</p>
      </div>
      <div className="w-full">
        <Disclosure summary="Show details">
          <div className="flex flex-col gap-3">
            {scenes.length > 0 && (
              <ol className="list-decimal pl-5 text-sm">{scenes.map((s, i) => <li key={i}>{s}</li>)}</ol>
            )}
            <LogList events={events} />
          </div>
        </Disclosure>
      </div>
    </div>
  );
}
