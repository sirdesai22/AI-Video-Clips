**Video type: Data story.** A short narrated film whose subject is numbers. Each number is earned by the scene before it, then made physical. The one thing is the single point the data makes, in one line.

### Numbers come only from sources
- Every number spoken or shown comes from a source you read or the owner's own words, and goes in `claims` with its source. A number with no source is left out, not estimated.
- Never derive a claim the source did not make ("40 min to 2 min" is not "20× faster"). Round the same way everywhere a number appears.
- If the sources give too few numbers for the story, make the film shorter rather than filling it.

### Story shape by angle (owner's angle if set, else the one the data supports)
- **one-number**: the context a viewer knows → the question → the number lands → what it means in their life.
- **trend**: the starting point → the line draws through time → the one point that matters, annotated → where it leaves us.
- **comparison**: two values side by side → one highlighted, the other greyed → the gap made physical (one bar becomes the ground of the next scene).
- **ranking**: bars reveal in order → name any overtake and when it happens → the leader pulses once → hold.

### Scenes
- One number per scene, at most. Never two count-ups at once.
- `onScreen` is the formatted number or the chart's title: "$4.2M", "41%", "3× since 2019". The chart's one point goes in its title.
- `visual`: name the picture and the encoding: which chart (bar, line, map), which series is highlighted, which are grey, the annotation's text, and the source line in small type ("Source: [name], [year]").
- Every count-up is written as "counts up to [value] in about 1.4 s, then holds settled": 1.2–1.6 s on an ease-out, landing on the exact source value, then a hold. The scene never opens on a number already moving; the count starts once the scene has set it up.
- `motion` (optional): e.g. "bars stagger 60 ms apart, labels count with them, no overshoot". `transition` (optional): with its cause, e.g. "the camera dives into the 2024 bar, which becomes the next ground". `block` (optional): `data-chart`, `apple-money-count`, `us-map`, `us-map-bubble`, `us-map-flow`, `us-map-hex`, `spain-map`, `world-map`, `nyc-paris-flight`.

### Hook and ending
- Scene 1 makes the number matter before it appears: a situation or a question the audience has. Not "Let's look at the data".
- The last scene states the takeaway in one line over the settled chart or number, held at least 2 s. No new number in the last scene.

### The owner's exact wording and call to action
- Exact wording goes in verbatim, unchanged, in the scene and field it names (`spoken` or `onScreen`); if it names no scene, put it where it fits best, still unchanged.
- A call to action goes on the final scene, quoted exactly in `onScreen`, after the takeaway has landed.

### Words and time
- About 2.2 spoken words a second, 8–16 words a scene (19 hard cap). Leave room: a count-up needs about 1.4 s of picture plus its hold.
- Say numbers the way a person would ("four point two million"), but write them formatted in `onScreen`. Do not speak every number shown; speak the one that matters.

### Look, concept and sound
- `concept.device`, pick one: "A number lands", "Life before and after", "The object is the explanation", "A question with the input".
- `concept.form`, pick one: "One frame that rebuilds", "An endless zoom", "Match cuts", "A flight through one world".
- `concept.spectacle`: the one number turned physical, e.g. "the 41% bar rises into a skyline", "the share becomes a crowd".
- `look`: ground, ink and ONE highlight accent, hex; the rest of the data in a neutral grey. Ink and accent must stand clear of the ground. A dark slate ground is fine when the chart fills the frame.
- `look.type`: include tabular figures, e.g. "condensed sans with tabular figures, numbers at 25% of frame height".
- `look.captionStyle`: `caption-clip-wipe` or `caption-weight-shift`; numbers in captions highlighted in the accent.
- `look.voiceTone`: e.g. "measured male, clear, unhurried". `look.musicMood`: e.g. "sparse low pulse, 95 bpm, under -18 dB".

### Example of a strong data story (slots in [brackets])
- idea "[Working from home went from rare to normal in five years]"; angle trend; claims carry [the source's 2019 and 2024 shares].
- concept: device "A number lands"; form "One frame that rebuilds"; spectacle "[the 2024 point rises off the line and becomes a skyline of home offices]".
- 1: spoken "[In 2019, six percent of workdays happened at home.]" · onScreen "[6% in 2019]" · visual "[a sunlit kitchen table filling the frame, a closed laptop on it, a wall calendar showing 2019; the 6% lands on the laptop lid; source line under it]".
- 2: spoken "[By 2024, it was twenty-eight percent.]" · onScreen "[28% by 2024]" · visual "[a line draws from 2019 to 2024; the end value counts up to [28%] in about 1.4 s, then holds; source line: 'Source: [name], [year]']" · block "data-chart".
- last: spoken "[The office didn't disappear. It moved into the spare room.]" · onScreen "[The office moved home]" · visual "[the settled chart, the 2024 point in the accent]".
