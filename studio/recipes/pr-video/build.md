**Video type: PR video.** Read `references/film.md` ("From a pull request") first, then `references/types/explainer.md`, `story.md`, `spec.md`, `motion.md`, `sound.md` and `captions.md`. Vertical: also `references/types/vertical.md`.

### The code is in the script
- Every hunk you show is in SCRIPT.json `visual`, copied from the PR's diff. Use those lines verbatim; never retype code from memory, extend a hunk, or invent lines around it.
- The version, the repo and the authors' names are in SCRIPT.json. Never invent or "correct" a version. An open PR stays "proposed" on screen.

### Code on screen
- Use the scene's `block`: `code-diff` for a change, `code-morph` for a refactor, `code-typing` for new code, `code-highlight` to point at lines, `code-scroll` for a longer file. Confirm with `npx hyperframes catalog --query code --json`.
- The `code-*` blocks are 1920×1080 scenes driven by `window.__TOKENS` (Shiki tokens, `github-dark`) and `window.__BLOCK` (`{id, effect, seq, line?, duration}`). `code-diff` and `code-morph` need at least two states. `code-highlight` counts lines from 0, `code-scroll` from 1.
- Typical lengths: `code-typing` 5 s, `code-diff` 6 s, `code-highlight` 5 s, `code-scroll` 6 s, `code-morph` 7 s. `code-typing` types at a fixed speed: check characters × speed fits the scene.
- Code stays legible: at least 28 px at 1080, 4–12 lines, the target lines named and highlighted. End each code beat on a hold (a blinking caret is fine), not mid-type.
- The blocks reserve no caption band: inset the panel when captions are on. In 9:16, recompose the panel for the vertical frame; never squeeze a landscape panel.

### Impact before code
- Non-code scenes show behaviour, not code: the bug happening, the new option working, a before and after on one stage. Build them as clean diagrams or a recreated minimal UI clearly derived from the script; never a fake product screen dressed as real.
- +N/−M and files changed go on one stat card, never in the voice.
- The end card: the version and the repo (or the repo alone), landing and holding 2–3 s.

### Concept and motion
- SCRIPT.json `concept` decides the device and form. For "Life before and after", the new side moves calmly while the old side churns.
- Carry one object across scenes (the progress bar, the function name, the file tab) so cuts have a cause.
- Transitions at medium energy, each caused on screen: `whip-pan`, `cinematic-zoom`, `transitions-push`, `cover` at 0.3–0.5 s. A code beat can open by zooming into the file tab that the previous scene showed.
- Titles land and hold still; arrivals `expo.out`, camera `power2.inOut`.

### Look
- SCRIPT.json `look` is the LOOK line. The code panel uses `github-dark`; the film around it uses the look's ground, ink and accent, so the film is not one dark editor from start to end.
- The accent marks the changed line, the payoff and the version.

### Captions
- `look.captionStyle`, usually `caption-clip-wipe` or `caption-weight-shift`; groups of 3–5 words; no glitch or matrix styles unless the project's own brand uses them.

### Sound
- Music per `look.musicMood`, about 0.14 volume under the voice. A soft key tick while code types (drop it over strong music), a pop when the stat card or version lands, a whoosh on scene cuts (rotate takes). Peaks one frame after the picture.

### Avoid
- Opening on code; showing the whole diff or a whole file; reading the PR description aloud.
- @handles on screen or in the voice; an invented version; presenting unmerged work as shipped.
- Green-on-black "hacker" terminals, matrix rain, glitch effects as decoration; three cards listing changes.
