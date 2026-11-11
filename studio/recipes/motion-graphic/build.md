**Video type: Motion graphic.** Read `references/film.md` ("Short motion pieces"), `motion.md`, `spec.md`, `sound.md`, and `references/types/data.md` for any number or chart. Vertical: also `references/types/vertical.md`. This is a short single-idea piece: the approved script is the story, so there is one storyline (the script's concept) and SPEC.md is short.

### No narration
- No voice stage: there is no TTS for this video. `spoken` is empty by design.
- Every word on screen is SCRIPT.json `onScreen`, verbatim. Do not add, paraphrase or translate copy.

### Beats and timing
- Follow each scene's `estSeconds` exactly, in order. Write SPEC.md's SHOTS with frame ranges at 30 fps; nothing overlaps unless the script says it does.
- Shape: setup (enters) → movement (typing, counting, assembling, routing) → payoff (lands, holds at least 0.5 s plus 0.3 s a word, the last line at least 2 s) → settled end with a quiet idle. An overlay instead enters, holds and clears fully.
- Movement must carry meaning. Animate only what is live (the number, the line, the route); a landed title is dead still.

### Technique
- Kinetic type: 3–6 words a beat on a reel, up to 7 on landscape; one hero word at display scale (titles 4–9% of frame height, hero words up to 60–90% of the width). Vary entrances: per-word blur-in 0.13 s, 0.067 s apart; grey-to-ink; per-letter for a name, 0.1 s apart.
- Count-up: tabular figures (`font-variant-numeric: tabular-nums`), fixed digit columns, counts TO the value in 1.2–1.6 s on an ease-out, then holds; it lands on a hard stop or a downbeat. Never overshoot a number.
- Chart: frame and axis → data draws in, staggered (list items 40–80 ms apart) → one annotation on the point that matters → the leader pulses once → hold.
- Overshoot only on physical objects (cards, flaps), never on text, UI or numbers. Snappy = `power4.out` at about 0.2–0.4 s; dramatic = `expo.out`.
- `concept.spectacle` happens once, at full speed. Everything else is restrained.

### Registry
- Use SCRIPT.json `block` when set. Blocks that suit this type: `code-typing`, `vfx-shatter`, `apple-money-count`, `x-post`, `data-chart`, `us-map`, `world-map`, `nyc-paris-flight`, `vfx-liquid-background`, `code-particle-assemble`, `swirl-vortex`. Confirm with `npx hyperframes catalog --query <name> --json`, then adapt copy, timing, colours and fonts to SCRIPT.json. A block is a starting point.
- Map blocks fetch geography at runtime: bake it in so the render makes no network fetch.
- Between beats, a transition only with a cause. High energy: `ridged-burn`, `glitch`, `chromatic-radial-split`, `transitions-scale` at 0.15–0.3 s; calmer pieces: `transitions-blur` or `cross-warp-morph` at 0.5–0.8 s. Never fade out then fade in.

### Look
- SCRIPT.json `look` is the LOOK line. One ground, one accent. A dark ground only with the hero filling at least 40% of the frame; never small things floating in a void.
- Output: 1920×1080 (or 1080×1920 for a reel) at 30 fps, MP4. No transparency unless it is explicitly an overlay.

### Sound
- `look.musicMood` "none" means no music bed, not silence: place effects on the visible actions. Silence only when the script says "no audio at all".
- Effects: a soft key tick on typing, a pop when a number or badge lands, one riser into the spectacle. Each hit 3–6 dB over any bed, its peak one frame after its picture. A move that must land on a hit starts 40–190 ms early.

### Avoid
- Narration or captions of any kind.
- Glow, bloom, neon, floating particles as decoration, purple or blue gradients.
- Breathing or floating loops on the final title; a frozen tail; ending on a transition's hand-off frame.
- Stretching 5 s of content to fill 12 s; unformatted numbers.
- A slow or open-ended count: every count runs 1.2–1.6 s on an ease-out, lands on the exact source value and holds; the beat never opens on a number already moving.
