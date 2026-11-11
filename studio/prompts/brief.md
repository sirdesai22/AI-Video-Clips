# Brief

## Format
- {{formatName}}, {{width}}x{{height}}, 30 fps, MP4. Set the root composition and every scene to this size. Compose for this frame; never crop another aspect into it.
- Video type: {{recipeLabel}}. Target length {{duration}}.
{{formatSafe}}

## The approved script
- SCRIPT.json is APPROVED: build it without questions or stops. The design pass (STORYLINES.md, then SPEC.md) still happens, silently, as your build instructions say.
- {{spokenRule}}
- Each scene's `onScreen` is shown verbatim; its `visual`, `motion`, `transition` and `block` are that scene's brief.
- Facts on screen must match SCRIPT.json: add no number, round none differently, derive no new claim.
{{sourceRule}}

## Read before STAGE: look
The hyperframes skill is in `.claude/skills/hyperframes/`. Read these from it:
{{readList}}

## Look (binding)
- ground `{{ground}}` · ink `{{ink}}` · accent `{{accent}}`
- type: {{type}}
- caption style: {{captionStyle}} · voice tone: {{voiceTone}} · music: {{musicMood}}
- {{paletteRule}}
- SPEC.md's LOOK line uses these hexes. Turn the type direction into a face, weight, px size and tracking (bundled faces, or `@font-face` to a file in `assets/fonts/`), and the look into the rules of one medium with numbers (grain %, shadow offset/blur/opacity, stroke width). The accent is rationed: the keyword, the payoff, the last line.

## Concept (the recommended storyline)
- device: {{device}} · form: {{form}}
- Spectacle beat: {{spectacle}}. It happens once, at its scene, at full speed; give it its own frame range in SPEC.md's SHOTS. Everything else stays restrained so it lands.

## Voice
{{voiceRule}}

## Captions
{{captionRule}}

## Sound plan
{{soundPlan}}

## Never (put these in SPEC.md's BANNED line)
- a dark void with small things floating in it;
- glow, bloom or particles as decoration;
- three cards in a row (or any row of feature or KPI cards);
- bullets or bullet slides;
- the logo docked in a corner;
- text over a dimmed screenshot;
- a fade out then a fade in between scenes.

## The end
- End on a settled frame: everything has landed and the last line holds at least 2 s. Only the world behind may keep a slow drift; titles stay dead still. Never end on a transition's hand-off frame or cut off mid-move.

## Video type rules: {{recipeLabel}}
{{recipeBuild}}

## Delivery
- Final render: `{{renderPath}}` (relative to this folder). Then check it with `npx hyperframes audio {{renderPath}} --json`.
