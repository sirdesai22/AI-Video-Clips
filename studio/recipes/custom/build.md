**Video type: Custom.** Follow the skill's general path: `SKILL.md` ("Work loop"), then `references/story.md`, `spec.md`, `look.md`, `film.md` ("Script and pacing"), `motion.md` and `sound.md`. Then read the type file closest to the idea (`references/types/explainer.md`, `launch.md`, `data.md`, `character.md`, `3d.md`) and borrow its shape. Vertical: also `references/types/vertical.md`.

### Concept into film
- SCRIPT.json `concept` is approved: its device decides what the story is; its form decides how the camera and cuts carry it. Write SPEC.md from it.
- Visit several worlds, each with its own ground, light and scale; enter each through an object already on screen. Keep one home stage, one carrier the eye follows, and the palette and type constant across worlds.
- In each shot one hero move; secondary moves travel 50–70% as far and start 100–200 ms after it; everything else holds still. Something new every 2–4 s.
- The hero fills at least 40% of the frame's height or width. A small object in the middle of an empty frame is never a shot.
- `concept.spectacle` happens once, at full speed; everything else stays restrained.
- If a beat needs a real picture you cannot make or get (a real person, a real place's imagery, a product screen), use a clearly labelled placeholder and say so; never fake it.

### Look
- SCRIPT.json `look` is the LOOK line. Build it as the rules of one medium (paper and ink, clay, photographs, flat vector, 3D studio) with numbers: grain %, shadow offset and blur, stroke width.
- Accent rationed: one highlighted word per shot, the payoff, the last line.
- Compose each requested format for itself; never crop one aspect into another.

### Motion
- Narrated: the voice is the clock; each element lands on the word that names it, across the back half of the scene.
- Titles land and hold dead still; vary entrances (per-word blur-in, grey-to-ink, line blur-in). Arrivals `expo.out` / `power4.out`, camera `power2.inOut`, exits `power3.in` and 40–50% shorter than entrances.
- Overshoot only on physical things (cards, flaps, characters), never on text, UI or numbers.
- Transitions: 3–5 kinds, each caused by something on screen, matched to the film's energy. Calm: `cross-warp-morph`, `light-leak`, `transitions-blur` (0.5–0.8 s). Medium: `whip-pan`, `cinematic-zoom`, `transitions-push`, `cover` (0.3–0.5 s). High: `ridged-burn`, `glitch`, `chromatic-radial-split`, `transitions-scale` (0.15–0.3 s). Never fade out then fade in.

### Registry
- Before hand-building any named visual (a chart, a lower third, a social post, a map, a code panel), search: `npx hyperframes catalog --query <thing> --json`. Known fits: `data-chart`, `apple-money-count`, `code-typing`, `code-diff`, `x-post`, `lt-clean-bar`, `lt-kicker-name`, `world-map`, `nyc-paris-flight`. Adapt to the look; a block is a starting point.

### Captions
- `look.captionStyle` ("none" means no captions unless the format requires them). One caption style for the film; keyword-only emphasis in the accent; groups of 2–3 words for high energy, 3–5 conversational, 4–6 calm.
- Match energy to content: no glitch or neon styles on calm or corporate films. `caption-neon-glow`, `caption-particle-burst` and other glow styles are banned defaults unless the brand itself uses them.

### Sound
- A film over about 15 s that tells something gets a music bed per `look.musicMood`, about 0.14 volume under a voice, entering at the track's strongest bar, 0.4 s fade-in, 1.5 s fade-out.
- Effects few and exact, each on a visible action: click (a real click), whoosh (a cut or a fast card), soft key tick (text typing on), pop (a badge or number landing), one riser into the spectacle. Rotate 2–3 takes; peaks one frame after the picture.

### Avoid
- Everything in `spec.md` "BANNED by default" and `story.md` §8; add any new default you spot in review to SPEC.md's BANNED line and fix it.
- Slides: scene after scene entering the same way, side-by-side panels standing in for a scene, bullets, three cards in a row.
- Breathing or floating loops on titles; a frozen tail. End on a settled state, the last line held at least 2 s.
