**Video type: Product launch.** A launch film built from the product's real site: its screens, its words, its colours. The one thing is "You can now …" in one line. If the input has no product URL, say so in `sources` and write only what the input itself states.

### Read the site first
- WebFetch the product URL (and at most two inner pages it links to, such as features or pricing). Note: the product name, the one new thing, real feature names, real UI labels, real numbers, the site's own call-to-action wording, and any brand colours you can see.
- Every claim on screen or in the voice traces to the site or the owner's words. Never invent a feature, a control, a screen, a number, a customer or a testimonial. A release ("2.0", "what's new") is not one thing: take its headline.

### Story shape by angle (owner's angle if set, else launch)
- **launch** (~35 s; scale it): hook ~8% (the need, or the feature already working) → tension ~12% (the old way failing on screen) → reveal ~8% (the product named, about 20–30% in) → proof ~40% (3–6 verbs, one per scene: paste, pick, watch it build, ship) → payoff ~20% (the output arrives, the biggest moment, 60–80% in) → claim ~8% (the one thing, one line) → end card ~8%.
- **tour**: the homepage, two inner pages, the footer; editorial pace, a showcase, not a sales pitch.
- **social** (vertical teaser, ~20 s): the problem in one line of large type → two feature beats, each one real screen with a caption of three words or fewer → the end card, held still.

### Scenes
- One verb per proof scene, done in the real interface. `visual` names the real page or section and the real label on it, e.g. "the 'Export' button on the editor page fills and opens the share sheet".
- Something happens in every shot: a result populates, a panel opens, a trace draws. A camera move over a still screenshot is not an action.
- A feature with nothing visible (speed, an API): real terminal output, a real analogue the viewer knows, or a checklist of real facts. Never a made-up dashboard.
- `motion` (optional): e.g. "camera pushes to the button in 0.5 s, holds while the list fills". `transition` (optional): with its cause, e.g. "zoom through the 'Generate' button into the result". `block` (optional): `x-post` or `macos-notification` only when the site shows a real post or alert.

### Hook and ending
- Frame 0 is the thumbnail: the feature working on something recognisable, or the moment that creates the need. Never the logo alone, never "Introducing" or "Meet" as the first line, never typing into a prompt box as the opener.
- Last scene is the end card: the product name and ONE call to action, the owner's wording or the site's own button text, quoted exactly in `onScreen`.
- Never "unlock", "seamless", "supercharge", "game-changer", "revolutionize", "effortless", or "in seconds" unless the site measured it.

### The owner's exact wording and call to action
- Exact wording goes in verbatim, unchanged, in the scene and field it names (`spoken` or `onScreen`); if it names no scene, put it where it fits best, still unchanged.
- The owner's call to action goes on the final scene, quoted exactly in `onScreen`; it replaces the site's own button text.

### Words and time
- About 2.2 spoken words a second, 8–15 words a scene (19 hard cap). A 30 s film is about 60 spoken words; a 45 s one about 90.
- The process runs fast; the payoff gets the most time. A length is a range, never padded.
- `onScreen`: at most one short line naming the change or the label, never the spoken sentence.

### Look, concept and sound
- `concept.device`, pick one: "The feature as the hook", "Life before and after", "The result first", "One object across apps", "A moment in someone's day", "A question with the input".
- `concept.form`, pick one: "Object-to-object chain", "One continuous take", "Split screen to one", "An endless zoom".
- `concept.spectacle`: one moment, usually the payoff, e.g. "the finished video bursts out of the preview pane to full frame".
- `look`: the brand's own palette. Give your best reading of its ground, ink and accent hex from the page; the accent is the colour that recurs across the most roles, never link blue (#0000EE) or a status red or green. The build confirms them against the captured tokens. The owner's palette knob overrides.
- `look.type`: the brand's own face if you can tell it, e.g. "the site's sans at 700, titles 7% of frame height".
- `look.captionStyle`: `caption-clip-wipe` or `caption-weight-shift` for landscape; `caption-highlight` for a reel; `caption-kinetic-slam` only for a loud social teaser.
- `look.voiceTone`: e.g. "confident female, brisk but clear". `look.musicMood`: e.g. "bright electronic pulse, 115 bpm, under -18 dB", or "none" for a quiet social teaser.

### Example of a strong launch (slots in [brackets])
- idea "[You can now turn any web page into a 30-second video]"; angle launch.
- concept: device "The result first"; form "Object-to-object chain"; spectacle "[the finished video bursts out of the preview to full frame]".
- 1: spoken "[Your launch is tomorrow. The video doesn't exist yet.]" · onScreen "[Launch: tomorrow 9:00]" · visual "[a calendar card with tomorrow's launch, an empty video folder beside it]".
- 3: spoken "[Paste the page you already have.]" · onScreen "[Paste a URL]" · visual "[the real 'New video' field on the dashboard; the URL types in; the 'Create' button fills]" · transition "[zoom through 'Create' into the build view]".
- last: spoken "[Try it free on your own site.]" · onScreen "[Try it free]" · visual "[the logo is carried in, the wordmark wipes in beside it, the real 'Try it free' button lands and holds]".
