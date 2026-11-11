"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomBar, Disclosure } from "./ui";
import type { Format } from "@/lib/types";

const VOICES = [
  { id: "am_michael", label: "Michael (US, calm)" },
  { id: "am_adam", label: "Adam (US)" },
  { id: "af_heart", label: "Heart (US, warm)" },
  { id: "af_nova", label: "Nova (US)" },
  { id: "bm_george", label: "George (UK)" },
  { id: "bf_emma", label: "Emma (UK)" },
];

const FORMATS: { id: Format; title: string; sub: string }[] = [
  { id: "reel", title: "Reel", sub: "9:16 · 20–45 s" },
  { id: "explainer", title: "Explainer", sub: "16:9 · 45–90 s" },
];

export default function NewVideoForm() {
  const router = useRouter();
  const [format, setFormat] = useState<Format>("reel");
  const [input, setInput] = useState("");
  const [opts, setOpts] = useState({ tone: "", length: "", audience: "", voice: "", exactWording: "", cta: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s) => {
      if (s.defaultFormat) setFormat(s.defaultFormat);
      if (s.defaultVoice) setOpts((o) => ({ ...o, voice: s.defaultVoice }));
    }).catch(() => {});
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/videos", { method: "POST", body: JSON.stringify({ format, input, options: opts }) });
    const d = await r.json();
    if (!r.ok) { setBusy(false); setError(d.error ?? "Something went wrong"); return; }
    router.push(`/v/${d.video.id}`);
  }

  const set = (k: keyof typeof opts) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setOpts((o) => ({ ...o, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      <div role="radiogroup" aria-label="Format" className="grid grid-cols-2 gap-4">
        {FORMATS.map((f) => (
          <button key={f.id} role="radio" aria-checked={format === f.id} onClick={() => setFormat(f.id)}
            className={`card cursor-pointer text-left transition hover:border-muted ${format === f.id ? "border-accent ring-2 ring-accent/30" : ""}`}>
            <div className="text-lg font-semibold">{f.title}</div>
            <div className="text-base text-muted">{f.sub}</div>
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">What&apos;s it about?</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={7}
          placeholder="Paste links, a story, or a topic" className="field resize-y" />
      </label>

      <Disclosure summary="More options">
        <div className="grid grid-cols-2 gap-4">
          <input className="field" placeholder="Tone (e.g. bold, calm, funny)" value={opts.tone} onChange={set("tone")} />
          <input className="field" placeholder="Length (e.g. about 30 seconds)" value={opts.length} onChange={set("length")} />
          <input className="field" placeholder="Audience" value={opts.audience} onChange={set("audience")} />
          <select className="field" aria-label="Voice" value={opts.voice} onChange={set("voice")}>
            {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <textarea className="field col-span-2" rows={2} placeholder="Wording that must stay exact" value={opts.exactWording} onChange={set("exactWording")} />
          <input className="field col-span-2" placeholder="Ending or call to action" value={opts.cta} onChange={set("cta")} />
        </div>
      </Disclosure>

      {error && <p role="alert" className="text-base text-danger">{error}</p>}
      <BottomBar>
        <button className="btn-primary" disabled={busy || input.trim().length < 3} onClick={submit}>
          {busy ? "Starting…" : "Write script"}
        </button>
      </BottomBar>
    </div>
  );
}
