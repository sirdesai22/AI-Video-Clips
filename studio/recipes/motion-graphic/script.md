**Video type: Motion graphic.** ONE short, design-led idea where the movement itself carries the message: a kinetic title, a stat count-up, a chart, an animated post, a route on a map. About 6–15 s. There is no narrator.

### No narration
- Every scene's `spoken` is exactly "" (empty). No voice, no voice tone.
- `onScreen` carries the exact words the viewer reads, quoted from the owner where given. Kinetic type: 3–7 words a scene.
- A scene here is a beat. 1–3 beats is normal; 6 is the ceiling.

### Shape: beats with exact seconds
- **Setup**: the element enters (0.5–1.5 s).
- **Movement**: the thing that carries the meaning happens: typing, counting, assembling, routing (2–5 s).
- **Payoff**: it lands and holds long enough to read: 0.5 s plus 0.3 s a word, at least 2 s on the final line.
- **Ending**: a settled final state with a quiet idle, or a clean clear if it is meant as an overlay.
- `estSeconds` is the exact length of each beat, not a word count. Beats must not overlap: write where one ends and the next begins ("the label is fully gone by 4.2 s; at 4.2 s the number stamps in").

### Shape by angle (owner's angle if set)
- **kinetic-title**: words snap or slide in one by one, the last word becomes the image, then hold.
- **count-up**: a small label → the number rolls up TO its value in 1.2–1.6 s and eases out → a delta stamps in → hold.
- **chart**: title and subtitle → bars reveal staggered with counting labels → the leader pulses once → hold.
- **social-post**: a real post's exact text and author, assembled and reacted to, then held.
- **map-route**: a marker at the origin → the path travels → a landing pop at the destination → settled map.

### Facts and copy
- Words, numbers and names come only from the owner's input or a source you read. Write numbers formatted the way they land ("$4.2M", "+312% YoY", "41%"). Put each number in `claims`.

### Per-beat detail
- `visual` covers the five slots in one or two sentences: the element, its motion, its layout, its style, its timing. Anything left out gets designed by the builder.
- `motion`: the feel in words, e.g. "snappy power4.out, 0.4 s, no bounce on text", "odometer roll that eases out and stops dead".
- `transition`: only between beats, with a cause, e.g. "the terminal shatters into the next beat".
- `block`: name one when it fits, because naming it pins the technique: `code-typing`, `vfx-shatter`, `apple-money-count`, `x-post`, `data-chart`, `us-map`, `world-map`, `nyc-paris-flight`, `vfx-liquid-background`, `code-particle-assemble`, `swirl-vortex`.

### Look, concept and sound
- `concept.device`, pick one: "Type carries the argument", "A number lands", "The feature as the hook", "A question with the input".
- `concept.form`, pick one: "One frame that rebuilds", "Cut on the beat", "Match cuts", "An endless zoom".
- `concept.spectacle`: exactly one, e.g. "a burst as the number lands", "a chromatic split on the final line", "the terminal shatters". Unnamed, it gets dropped.
- `look`: one ground and ONE accent, hex. A dark ground (navy, black, charcoal) is fine only when the hero fills the frame. Bold, large, readable type, e.g. "condensed heavy sans, hero word at 30% of frame width".
- `look.captionStyle`: "none". `look.voiceTone`: "none".
- `look.musicMood`: a short punchy bed or a single hit, e.g. "tight percussive sting, 120 bpm, hits on the landing", or "none" for effects only. Write "no audio at all" only if the owner wants silence.

### Example of a strong motion graphic (slots in [brackets])
- angle count-up; idea "[ARR reached $4.2M]".
- concept: device "A number lands"; form "One frame that rebuilds"; spectacle "[a burst of green ticks as +312% stamps in]".
- look: ground [#0E1B2C], ink [#F5F7FA], accent [#2BD47D]; type "[condensed heavy sans, number at 40% of frame height, tabular figures]"; captionStyle "none"; voiceTone "none"; musicMood "[tight percussive sting, hit on the landing]".
- 1 (0–1 s): spoken "" · onScreen "[ARR]" · visual "[the label fades in small, top centre]".
- 2 (1–4 s): spoken "" · onScreen "[$4.2M]" · visual "[the number counts up to $4.2M with an odometer roll, filling the centre, easing out]" · block "apple-money-count".
- 3 (4–6 s): spoken "" · onScreen "[+312% YoY]" · visual "[the delta stamps in green under the number, then everything settles into a still hold]".
