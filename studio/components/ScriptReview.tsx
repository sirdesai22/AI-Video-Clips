"use client";
import { useState } from "react";
import { BottomBar, Disclosure } from "./ui";
import type { VideoDetail } from "@/lib/actions";
import type { Script } from "@/lib/script-schema";

export default function ScriptReview({ detail, onChange }: { detail: VideoDetail; onChange: () => Promise<void> }) {
  const { video, script: current, scripts } = detail;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Script | null>(null);
  const [note, setNote] = useState("");
  const [askNote, setAskNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [heygenWarn, setHeygenWarn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!current) return null;
  const s = editing && draft ? draft : current.script;
  const flagged = new Set(s.claims.filter((c) => c.source === null).map((c) => c.sceneIndex));

  async function act(body: object) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/videos/${video.id}/script`, { method: "POST", body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "That didn't work."); return false; }
      await onChange();
      return true;
    } catch {
      setError("Couldn't reach the server. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function approve(skipCheck = false) {
    if (!skipCheck) {
      setChecking(true);
      try {
        const st = await fetch("/api/settings").then((r) => r.json()).catch(() => ({ heygen: "unknown" }));
        if (st.heygen === "signed_out") { setHeygenWarn(true); return; }
      } finally {
        setChecking(false);
      }
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    setHeygenWarn(false);
    await act({ action: "approve" });
  }

  async function recheckAndApprove() {
    setChecking(true);
    try {
      const st = await fetch("/api/settings?recheck=1").then((r) => r.json()).catch(() => ({ heygen: "unknown" }));
      if (st.heygen === "signed_out") return;
    } finally {
      setChecking(false);
    }
    await approve(true);
  }

  const updateScene = (i: number, k: "spoken" | "onScreen", val: string) =>
    setDraft((d) => d && { ...d, scenes: d.scenes.map((sc, j) => (j === i ? { ...sc, [k]: val } : sc)) });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{s.title}</h1>
        <p className="text-sm text-muted">
          About {Math.round(s.scenes.reduce((a, sc) => a + sc.estSeconds, 0))} s · {s.scenes.length} scenes · v{current.version}
        </p>
      </div>

      <ol className="grid gap-3 md:grid-cols-2">
        {s.scenes.map((sc, i) => (
          <li key={i} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Scene {i + 1}{i === 0 ? " · hook" : ""}</span>
              {flagged.has(i) && <span className="rounded-full bg-warn/15 px-2 py-0.5 text-warn">Check this fact</span>}
            </div>
            {editing ? (
              <>
                <textarea className="field" rows={2} value={sc.spoken} aria-label={`Scene ${i + 1} spoken`}
                  onChange={(e) => updateScene(i, "spoken", e.target.value)} />
                <input className="field" value={sc.onScreen} aria-label={`Scene ${i + 1} on screen`}
                  onChange={(e) => updateScene(i, "onScreen", e.target.value)} />
              </>
            ) : (
              <>
                <p className="text-base leading-snug">{sc.spoken}</p>
                <p className="text-sm font-semibold text-accent">“{sc.onScreen}”</p>
              </>
            )}
          </li>
        ))}
      </ol>

      <Disclosure summary="Details">
        <div className="flex flex-col gap-3 text-sm">
          <p><span className="text-muted">Idea:</span> {s.idea}</p>
          <p><span className="text-muted">Angle:</span> {s.angle} · <span className="text-muted">Voice:</span> {s.voice}</p>
          <div>
            <p className="text-muted">Sources</p>
            <ul className="list-disc pl-5">
              {s.sources.map((src) => (
                <li key={src.url} className={src.ok ? "" : "text-danger"}>
                  {src.url}{src.ok ? "" : ` (couldn't read${src.note ? `: ${src.note}` : ""})`}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-muted">Versions</p>
            <div className="flex flex-wrap gap-2">
              {scripts.map((v) => (
                <button key={v.version} className="btn-secondary" disabled={v.version === current.version || busy}
                  onClick={() => act({ action: "select", version: v.version })}>
                  v{v.version}{v.note ? ` · ${v.note}` : ""}
                </button>
              ))}
            </div>
          </div>
          <pre className="max-h-60 overflow-auto rounded-lg bg-bg p-2 text-xs">{JSON.stringify(s, null, 2)}</pre>
        </div>
      </Disclosure>

      {askNote && (
        <div className="flex flex-col gap-2">
          <input className="field" autoFocus placeholder="What should change? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-secondary" disabled={busy}
            onClick={async () => { if (await act({ action: "rewrite", note })) { setAskNote(false); setNote(""); } }}>
            Rewrite the script
          </button>
        </div>
      )}
      {heygenWarn && (
        <div className="card flex flex-col gap-3 border-warn">
          <p className="text-sm">You&apos;re not signed in to HeyGen, so this video won&apos;t have music. In a terminal, run <code>npx hyperframes auth login</code>.</p>
          <div className="flex gap-3">
            <button className="btn-secondary" disabled={busy || checking} onClick={() => approve(true)}>Build without music</button>
            <button className="btn-secondary" disabled={busy || checking} onClick={recheckAndApprove}>{checking ? "Checking…" : "I\'ve signed in"}</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <BottomBar>
        {editing ? (
          <>
            <button className="btn-secondary" onClick={() => { setEditing(false); setDraft(null); }}>Cancel</button>
            <button className="btn-primary" disabled={busy}
              onClick={async () => { if (await act({ action: "edit", script: draft })) { setEditing(false); setDraft(null); } }}>
              Save edits
            </button>
          </>
        ) : (
          <>
            <button className="btn-primary" disabled={busy || checking} onClick={() => approve()}>{checking ? "Checking…" : "Approve & make video"}</button>
            <button className="btn-secondary" onClick={() => { setDraft(structuredClone(current.script)); setEditing(true); }}>Edit</button>
            <button className="btn-secondary" onClick={() => setAskNote((x) => !x)}>Rewrite</button>
          </>
        )}
      </BottomBar>
    </div>
  );
}
