**Video type: Explainer.** Read `references/types/explainer.md` first, then `story.md`, `spec.md`, `film.md` ("Script and pacing"), `motion.md`, `sound.md` and `captions.md`. Vertical: also `references/types/vertical.md`.

### Concept into film
- SCRIPT.json `concept` is approved: its device and form decide how the camera and the cuts carry the film. Keep one visual language that develops: one home stage, one carrier the eye follows from scene to scene.
- Default technique, "one diagram that grows": start from the simplest true picture and add one part per scene, each appearing on the word that names it. Never drop a finished diagram on screen.
- Prefer continuous transformation to cuts: a bar becomes an axis, a dot becomes a crowd, the envelope becomes the next ground.
- Every object reads as what it is without a label (material, mount, scale). The hero fills at least 40% of the frame's height or width.
- Labels sit on the part they name, with a leader line when needed, and appear with it. No legends.
- `concept.spectacle` happens once, at its scene, at full speed. Nothing else competes with it.

### Look
- SCRIPT.json `look` is the LOOK line of SPEC.md. Turn `look.type` into a face, weight, px size and tracking. Bundled faces only, or `@font-face` to a file in `assets/fonts/`.
- Build the diagrams from one medium with numbers (e.g. 6 px ink strokes on a flat ground with 2% grain; or flat vector fills with one 12 px, 0.35-opacity shadow). Every gradient, glow or glass card is a default: leave it out.
- The accent is rationed: the one keyword per scene, the payoff, the last line.

### Motion
- The voice is the clock. Each part lands on its spoken cue, across the back half of the scene. Nothing appears all at once in the first quarter.
- Titles land and then hold dead still. Vary entrances across the film: per-word blur-in (0.13 s each, 0.067 s apart), grey-to-ink per word, whole-line blur-in 8 px → 0 in 0.15 s. Never fade-and-slide-up on every element.
- Eases by role: arrivals `expo.out` or `power4.out`; camera and colour floods `power2.inOut`; exits `power3.in`, 40–50% shorter than the entrance. Overlap: the next element starts when the last is 30–50% done.
- Transitions: 3–5 kinds in the film, each caused by something on screen. Explainer energy is medium: `whip-pan`, `cinematic-zoom`, `transitions-push` or `cover` at 0.3–0.5 s. For a calm topic: `cross-warp-morph` or `transitions-blur` at 0.5–0.8 s. Never a fade out then a fade in.
- Use SCRIPT.json `transition` and `motion` where given; they are the script writer's intent, not optional decoration.

### Registry
Blocks that suit an explainer: `data-chart` for a chart, `apple-money-count` for a money count-up, `code-typing` or `code-highlight` for code on screen, `x-post` for a quoted post. Confirm each with `npx hyperframes catalog --query <name> --json` and adapt it to the look; a block is a starting point, not a drop-in.

### Captions
- Use `look.captionStyle`. Calm or clean: `caption-clip-wipe` or `caption-weight-shift`. Thoughtful: `caption-editorial-emphasis`. Energetic reel: `caption-highlight`.
- Groups of 3–5 words, one group on screen at a time, the keyword in the accent and nothing else highlighted. One caption style for the whole film. No glitch or neon styles on an explainer.

### Sound
- Music per `look.musicMood`, about 0.14 volume under the voice. Enter at the track's strongest bar; 0.4 s fade-in, 1.5 s fade-out under the last line.
- Effects only on visible actions: a soft key tick when text types on, a pop when a label or number lands, a whoosh on a scene cut (rotate 2–3 takes), one riser into the spectacle beat. Each peak lands one frame after its picture.

### Avoid
- Opening on the diagram alone; the whole diagram at once; the narrator's sentence repeated on screen.
- Bullet slides, icons in circles, three cards in a row, a dark void with small things floating in it.
- Breathing or floating loops on titles; a slow creeping scale late in a scene; stock imagery; a brand end card nobody asked for.
- The end: the one idea in one line, held at least 2 s, on a settled frame. If anything still moves, it is the world behind (a 3–5° a second drift), never the title.
