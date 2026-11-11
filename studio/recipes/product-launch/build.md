**Video type: Product launch.** Read `references/types/launch.md` first, then `story.md`, `spec.md`, `look.md` ("From a brand"), `film.md` ("From a website"), `motion.md` and `sound.md`. Vertical: also `references/types/vertical.md`.

### Capture the real site first
- Run `npx hyperframes capture <url> --json` on the product URL from SCRIPT.json `sources` before writing SPEC.md. Open the screenshots and look at them before choosing anything.
- The capture failed if it exits non-zero, prints `ok: false`, writes `BLOCKED.md`, or reports "very little text content" with an empty asset catalog. Then take no brand data from its files: build clean product-style type and shapes from the script, show each missing screen as a clearly labelled placeholder ("Screenshot: Settings → Export"), and say so in your final message.
- Brand tokens from `extracted/tokens.json`: the accent is the colour that recurs across the most roles; never link blue `#0000EE` or a status red or green. If the captured tokens differ from SCRIPT.json `look`, use the brand's and say so (unless the owner set a palette).
- Fonts: keep the captured `@font-face` rules from `extracted/page.html`; use only weights the brand ships. Icon fonts are never the display or body face.
- Logo: the captured file only. A `logo-*.svg` name is a guess; look at it before using it. Never redraw a logo or an icon.

### Real UI, never a mockup
- Everything that claims to be the product is the product. Use the captured screenshots; rebuild in HTML only the piece that moves, placed at measured positions over the capture.
- Per proof beat: establish the workspace (enough real navigation to locate the task) → isolate the action at 1.6–2× its real size (text stays at least 26 px at 1080p after the push) → return the result to its place or pull back to where it is used.
- Something acts in every shot: a result populates, a panel opens, a trace draws. Never a camera drifting over a frozen screenshot, never a small window in an empty canvas, never UI tilted in 3D.
- Camera moves take 0.4–0.6 s with motion blur, arrive at the control the cursor needs, then hold while the UI acts. Containers morph instead of cutting (the button becomes the menu).
- The cursor is 4–7% of the frame, enters from off-screen, and its click causes the next thing on the same frame.

### Worlds and transitions
- Several worlds (the desktop, the product on a brand-colour ground, a close-up), each entered through an object already on screen.
- 3–5 transition kinds, each with a cause: zoom through a button, an object becomes the world, a morph, a carry-across, an iris from the click. Registry options at medium energy: `whip-pan`, `cinematic-zoom`, `transitions-push`, `cover` (0.3–0.5 s); for a loud social teaser: `transitions-scale` or `chromatic-radial-split` (0.15–0.3 s).
- A palette change touches the root, every scene surface and every timeline colour tween together; keep the product's status colours.

### End card
- The mark lands in the last 5–10% of the film, centred, the lockup 15–30% of frame width, performed: the cursor clicks it and a fill rises through it, or it is carried in, then the wordmark wipes in. Then the call to action (a real button or the command to type), held 1.5–3 s.

### Captions
- `look.captionStyle`, one line per feature beat. Landscape: `caption-clip-wipe` or `caption-weight-shift`. Reel: `caption-highlight`, groups of 2–3 words. Keyword in the brand accent only.

### Sound
- Music per `look.musicMood`, about 0.14 volume under the voice; "none" means no bed, effects still allowed. Let the music open up when the product appears.
- Click only on real cursor clicks, a whoosh on scene cuts (rotate takes), a pop on a badge or number landing, one riser into the end-card mark. Peaks one frame after the picture.

### Avoid
- An invented button, dashboard, number or testimonial; a sequence of full-page screenshots with titles.
- Typing into a prompt box as the opener; a feature list as three cards; a title over a dimmed screenshot; the logo docked in a corner.
- Floating close-ups with no workspace; a frozen tail after the call to action.
