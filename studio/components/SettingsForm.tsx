"use client";
import { useEffect, useState } from "react";
import { BottomBar } from "./ui";

type Heygen = "signed_in" | "signed_out" | "unknown";
type Form = { defaultVoice: string; defaultFormat: string; model: string };

const VOICES = [
  { id: "am_michael", label: "Michael (US, calm)" },
  { id: "am_adam", label: "Adam (US)" },
  { id: "af_heart", label: "Heart (US, warm)" },
  { id: "af_nova", label: "Nova (US)" },
  { id: "bm_george", label: "George (UK)" },
  { id: "bf_emma", label: "Emma (UK)" },
];

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export default function SettingsForm() {
  const [form, setForm] = useState<Form>({ defaultVoice: "am_michael", defaultFormat: "reel", model: "" });
  const [heygen, setHeygen] = useState<Heygen | "checking">("checking");
  const [loadError, setLoadError] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [checkError, setCheckError] = useState(false);

  // Stored defaults load fast; the HeyGen check can take up to a minute, so it loads separately.
  const checkHeygen = (recheck: boolean) =>
    fetch(`/api/settings${recheck ? "?recheck=1" : ""}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setHeygen(d.heygen); setCheckError(false); })
      .catch(() => { setHeygen("unknown"); setCheckError(true); });
  useEffect(() => {
    fetch("/api/settings?heygen=0")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setForm({ defaultVoice: d.defaultVoice, defaultFormat: d.defaultFormat, model: d.model }); setLoaded(true); })
      .catch(() => setLoadError(true));
    void checkHeygen(false);
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/settings", { method: "POST", body: JSON.stringify(form) });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? "Saved." : d.error ?? "Couldn't save settings.");
    } catch {
      setMsg("Couldn't save settings. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const heygenText =
    heygen === "checking" ? "Checking HeyGen…"
    : heygen === "signed_in" ? "Signed in. Videos get music and sound effects."
    : heygen === "signed_out" ? "Not signed in. In a terminal, run: npx hyperframes auth login"
    : checkError ? "Couldn't check HeyGen right now."
    : "Couldn't check right now.";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-semibold">Settings</h1>
      {loadError && <p role="alert" className="text-sm text-danger">Couldn&apos;t load settings</p>}
      <div className="card flex flex-col gap-2">
        <p className="text-sm font-medium">HeyGen music library</p>
        <p className="text-sm text-muted">{heygenText}</p>
        <button className="btn-secondary self-start" disabled={heygen === "checking"} onClick={() => { setHeygen("checking"); void checkHeygen(true); }}>Check again</button>
      </div>
      <Labeled label="Default format">
        <select className="field" value={form.defaultFormat} onChange={set("defaultFormat")}>
          <option value="reel">Reel (9:16)</option>
          <option value="explainer">Explainer (16:9)</option>
        </select>
      </Labeled>
      <Labeled label="Default voice">
        <select className="field" value={form.defaultVoice} onChange={set("defaultVoice")}>
          {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </Labeled>
      <Labeled label="Claude model (blank = your Claude Code default)">
        <input className="field" value={form.model} placeholder="e.g. sonnet" onChange={set("model")} />
      </Labeled>
      {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
      <BottomBar><button className="btn-primary" disabled={saving || !loaded} onClick={save}>{saving ? "Saving…" : "Save settings"}</button></BottomBar>
    </div>
  );
}
