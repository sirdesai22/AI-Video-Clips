"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomBar, Disclosure } from "./ui";
import { AUTO_VOICE_LABEL, VOICES } from "./voices";
import type { Recipe } from "@/lib/recipes";
import type { Format, RecipeId, VideoOptions } from "@/lib/types";

const FORMATS: { id: Format; title: string }[] = [
  { id: "reel", title: "Reel 9:16" },
  { id: "landscape", title: "Landscape 16:9" },
];

function Labeled({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "col-span-2" : ""}`}>
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

type Knob = Recipe["knobs"][number];
const EMPTY_OPTS: Required<VideoOptions> = {
  tone: "", length: "", audience: "", voice: "", exactWording: "", cta: "", angle: "", palette: "", voiceTone: "", musicMood: "",
};

export default function NewVideoForm() {
  const router = useRouter();
  const [format, setFormat] = useState<Format>("reel");
  const [input, setInput] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeId, setRecipeId] = useState<RecipeId>("explainer");
  const [recipesError, setRecipesError] = useState(false);
  const [opts, setOpts] = useState(EMPTY_OPTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings?heygen=0").then((r) => r.json()).then((s) => {
      if (s.defaultFormat) setFormat(s.defaultFormat === "explainer" ? "landscape" : s.defaultFormat);
      if (s.defaultVoice) setOpts((o) => ({ ...o, voice: s.defaultVoice }));
    }).catch(() => {});
    fetch("/api/recipes").then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setRecipes(d.recipes))
      .catch(() => setRecipesError(true));
  }, []);

  const recipe = recipes.find((r) => r.id === recipeId);
  const has = (k: Knob) => recipe?.knobs.includes(k) ?? false;

  async function submit() {
    setBusy(true);
    setError(null);
    // Only send the knobs this type shows, so a hidden leftover value never reaches the script.
    const sent = Object.fromEntries(Object.entries(opts).filter(([k]) => has(k as Knob)));
    try {
      const r = await fetch("/api/videos", { method: "POST", body: JSON.stringify({ format, recipe: recipeId, input, options: sent }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Something went wrong"); setBusy(false); return; }
      router.push(`/v/${d.video.id}`);
    } catch {
      setError("Couldn't start — is the app still running?");
      setBusy(false);
    }
  }

  const set = (k: keyof VideoOptions) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setOpts((o) => ({ ...o, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span id="shape-label" className="text-base font-medium">Shape</span>
        <div role="radiogroup" aria-labelledby="shape-label" className="grid grid-cols-2 gap-4">
          {FORMATS.map((f) => (
            <button key={f.id} role="radio" aria-checked={format === f.id} onClick={() => setFormat(f.id)}
              className={`card cursor-pointer text-left transition hover:border-muted ${format === f.id ? "border-accent ring-2 ring-accent/30" : ""}`}>
              <div className="text-lg font-semibold">{f.title}</div>
              {recipe && <div className="text-base text-muted">{recipe.duration[f.id]}</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span id="type-label" className="text-base font-medium">Type</span>
        {recipesError && <p role="alert" className="text-base text-danger">Couldn&apos;t load the video types. Reload the page.</p>}
        <div role="radiogroup" aria-labelledby="type-label" className="grid grid-cols-3 gap-4">
          {recipes.map((r) => (
            <button key={r.id} role="radio" aria-checked={recipeId === r.id} onClick={() => { setRecipeId(r.id); setOpts((o) => ({ ...o, angle: "" })); }}
              className={`card cursor-pointer text-left transition hover:border-muted ${recipeId === r.id ? "border-accent ring-2 ring-accent/30" : ""}`}>
              <div className="text-base font-semibold">{r.label}</div>
              <div className="text-sm text-muted">{r.tagline}</div>
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">What&apos;s it about?</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={7}
          placeholder={recipe?.inputPlaceholder ?? "Paste links, a story, or a topic"} className="field resize-y" />
        {recipe?.needsUrl && <span className="text-sm text-muted">This type works best with a link — paste the page or pull request address.</span>}
      </label>

      <Disclosure summary="More options">
        <div className="grid grid-cols-2 gap-4">
          {has("angle") && recipe && (
            <Labeled label="Angle">
              <select className="field" value={opts.angle} onChange={set("angle")}>
                <option value="">Auto</option>
                {recipe.angles.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Labeled>
          )}
          {has("palette") && <Labeled label="Palette"><input className="field" placeholder="e.g. warm paper, deep green" value={opts.palette} onChange={set("palette")} /></Labeled>}
          {has("voiceTone") && <Labeled label="Voice tone"><input className="field" placeholder="e.g. calm male, unhurried" value={opts.voiceTone} onChange={set("voiceTone")} /></Labeled>}
          {has("musicMood") && <Labeled label="Music mood"><input className="field" placeholder="e.g. low pulsing synth, or none" value={opts.musicMood} onChange={set("musicMood")} /></Labeled>}
          {has("length") && <Labeled label="Length"><input className="field" placeholder="e.g. about 30 seconds" value={opts.length} onChange={set("length")} /></Labeled>}
          {has("audience") && <Labeled label="Audience"><input className="field" placeholder="e.g. new parents" value={opts.audience} onChange={set("audience")} /></Labeled>}
          {has("voice") && (
            <Labeled label="Voice">
              <select className="field" value={opts.voice} onChange={set("voice")}>
                <option value="">{AUTO_VOICE_LABEL}</option>
                {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </Labeled>
          )}
          {has("exactWording") && <Labeled label="Wording that must stay exact" wide><textarea className="field" rows={2} value={opts.exactWording} onChange={set("exactWording")} /></Labeled>}
          {has("cta") && <Labeled label="Ending or call to action" wide><input className="field" placeholder="e.g. Follow for more" value={opts.cta} onChange={set("cta")} /></Labeled>}
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
