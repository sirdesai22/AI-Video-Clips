# Brief

- Format: {{formatName}}, {{width}}x{{height}}, 30 fps. Set the root composition and every scene to this size.
- The script in SCRIPT.json is APPROVED. Skip storylines and questions; build it now (no-stops mode).
- Keep every `spoken` line word for word. Use each scene's `onScreen` and `visual` as the brief for that scene.
- Voice: Kokoro voice `{{voice}}` via `npx hyperframes tts "<line>" -v {{voice}} -o assets/voice/<NN>.wav`, one file per scene. Measure each with ffprobe; the voice is the clock (scene length = line length + ~0.6 s).
- Music and sound effects: from the HeyGen catalog via the media-use skill. Music around 0.14 volume under the voice. If HeyGen is not signed in, continue without music and say so in your final message.
- {{captionRule}}
- Facts on screen must match SCRIPT.json; do not add numbers.
- Look: write SPEC.md first (palette, type, medium from the topic). Avoid the BANNED defaults in the skill's spec reference.
- Final render: `{{renderPath}}` (relative to this folder). Also check it with `npx hyperframes audio {{renderPath}} --json`.
