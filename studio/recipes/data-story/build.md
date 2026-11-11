**Video type: Data story.** Read `references/types/data.md` first, then `story.md`, `spec.md`, `film.md` ("Script and pacing"; "Maps and real places" for any map), `motion.md`, `sound.md` and `captions.md`. Vertical: also `references/types/vertical.md`.

### The data
- Every figure comes from SCRIPT.json (`onScreen`, `visual`, `claims`). Add no number, round no number differently, compute no new ratio.
- One data module drives every figure: put the values in one object at the top of the root composition and read every label, bar and count from it, so the numbers agree everywhere.
- Each data scene carries a small source line from its claim, e.g. "Source: [name], [year]", at least 28 px at 1080, out of the hero's way.
- A number marked illustrative in the script stays marked on screen.

### Numbers on screen
- The number is the biggest thing in its scene. Tabular figures (`font-variant-numeric: tabular-nums`) and fixed digit columns so a count does not jitter.
- A count-up runs 1.2–1.6 s on an ease-out, lands exactly on the source value, then holds settled. No overshoot, no bounce: an overshooting counter shows a value that was never true.
- One count at a time. The voice says the number as it lands (the voice is the clock).

### Charts as pictures
- Build in reading order: frame and axis → a reference line → the data draws in → one annotation on the point that matters. Annotate on the mark; no legends.
- Highlight one series in the accent, grey the rest. The chart's one point is its title.
- The same object carries across beats: a bar becomes the ground of the next scene, a line becomes the road the camera follows. The camera can dive into the one value that matters while the rest falls away.
- Drive any chart from a GSAP tween's `onUpdate`, never the library's own transitions.

### Registry
- Search first: `npx hyperframes catalog --query chart --json`. Blocks that suit this type: `data-chart` (bars), `apple-money-count` (a money count-up), `us-map`, `us-map-bubble`, `us-map-flow`, `us-map-hex`, `spain-map`, `world-map` (choropleth, bubbles, arcs, equal-area hexes), `nyc-paris-flight` (a route). Adapt colours, fonts and values to SCRIPT.json.
- Map blocks fetch geography at runtime: bake it so the render makes no network fetch. A real place shown as a place needs real imagery (`film.md`); a vector outline reads as a diagram.

### Motion and transitions
- `concept.spectacle` is the one number made physical (a count that becomes a skyline, a share that becomes a crowd), once, at full speed.
- Bars stagger 40–80 ms apart; labels count with them. Arrivals `expo.out` or `power4.out`; camera `power2.inOut`.
- Transitions: 3–5 kinds, medium energy, each caused on screen: `cinematic-zoom` into a value, `transitions-push`, `whip-pan`, `cover` at 0.3–0.5 s, or the data object becoming the next world. Never fade out then fade in.

### Look
- SCRIPT.json `look` is the LOOK line. Neutral grey for context data; the accent only on the highlighted series, the landing number and the takeaway.
- The chart fills the frame (hero at least 40% of height or width); never a small chart floating in a dark void.

### Captions
- `look.captionStyle`, usually `caption-clip-wipe` or `caption-weight-shift`; groups of 3–5 words; numbers in the accent. Keep captions clear of the chart's axis labels.

### Sound
- Music per `look.musicMood`, about 0.14 volume under the voice. A pop when a number or badge lands, a soft tick per bar only if the bars are few (rotate takes), one riser into the spectacle. Peaks one frame after the picture.

### Avoid
- A grid of KPI cards; a dashboard; a pie chart; every number counting up at once; a number with no source line.
- Unformatted numbers ("4200000"); counts that start the scene already moving; overtakes that are not named in the script.
- Ending on a hand-off frame or a frozen tail: end on the settled chart with the takeaway held at least 2 s.
