**Video type: PR video.** Explains what a pull request changed and why it matters to the people who use the project. The one thing is "what changed, and why it matters" in one line. A big PR: take its headline change.

### Read the PR first (WebFetch)
- The PR page: title, state (open, merged, closed), merge date, what it says it fixes or adds. Read the description for facts; never read it aloud.
- The diff: the PR URL plus `.diff` (e.g. `https://github.com/<owner>/<repo>/pull/<n>.diff`). This is where every hunk you show comes from.
- The commits: the PR URL plus `/commits`, to credit the commit authors (by commit count), not only the opener. Skip bots.
- The version: `https://github.com/<owner>/<repo>/releases`. Use the first non-draft release published at or after the merge; else the default branch's `package.json` version (`https://raw.githubusercontent.com/<owner>/<repo>/HEAD/package.json`), labelled "unreleased"; else no version, only the repo. Never invent a version. Put it in `claims` with its source.
- A page you cannot read (private repo, error): `sources` with `ok: false`; do not fill the gap from memory.

### Story shape by angle (owner's angle if set, else the one the PR is)
- **feature-reveal**: what users can do now → the change working (before and after) → one key code beat → how to start using it → version and repo.
- **changelog**: the headline change → up to three changes, one per scene, at most two code hunks → version and repo.
- **fix**: the symptom users saw → the root cause in one line → the fix as a small diff → version and repo.
- **refactor**: what stays the same for users → the structure before and after → why it is better (speed, safety, fewer lines) → version and repo.

### Scenes
- Open on user-facing impact, never on code, the PR title or the PR number.
- Show 2–4 real hunks in the whole film, each 4–12 lines, copied verbatim from the `.diff`. Put the file path and the hunk's lines (with their `+`/`-` markers) inside `visual`, so the builder never has to re-fetch or guess. Pick the lines that prove the point, not the whole file.
- `block` for a code scene: `code-diff` for a change, `code-morph` for a refactor, `code-typing` for brand-new code, `code-highlight` to point at lines in a file, `code-scroll` to travel through a longer file.
- Non-code scenes show the behaviour: the bug happening, the new option in use, a before and after.
- Name any action users must take (a migration, a config change, a breaking change) in its own scene.
- A PR that is open or unmerged is "proposed" or "coming", never "shipped" or "now available".
- Additions and deletions (+N/−M) and files changed go on a stat card in `visual`, never in `spoken`.

### Hook and ending
- Scene 1: the user's problem or the new ability, in plain words. Never "This PR…", never an @handle.
- Last scene `onScreen`: the version and the repo, e.g. "v2.4.0 · owner/repo"; without a version, the repo only. `spoken` says how to get it, and may thank the authors by name.
- Speak people's names, not @handles (TTS reads handles aloud).

### Words and time
- Length from the diff size (additions plus deletions), as a ceiling: up to 50 lines about 20–40 s; 50–200 about 40–70 s; larger, the recipe's top length.
- About 2.2 spoken words a second, 8–16 words a scene (19 hard cap). A code scene needs 5–7 s of picture: keep its spoken line short.
- Audience defaults to developers; for non-technical viewers, show fewer hunks and more behaviour.

### Look, concept and sound
- `concept.device`, pick one: "Life before and after", "The result first", "The feature as the hook", "The object is the explanation".
- `concept.form`, pick one: "Object-to-object chain", "Match cuts", "Split screen to one", "One frame that rebuilds".
- `concept.spectacle`: e.g. "the red line deletes itself and the error vanishes from the app behind it".
- `look`: the project's own colours if its README or site shows them, else a ground and one accent that suit the project; the code panel uses the github-dark theme. Type: e.g. "sturdy sans for titles at 7% of frame height, mono for code at 28 px or larger".
- `look.captionStyle`: `caption-clip-wipe` or `caption-weight-shift`.
- `look.voiceTone`: e.g. "calm male, plain, unhurried". `look.musicMood`: e.g. "light minimal electronic, 100 bpm, under -18 dB".

### Example of a strong PR video (slots in [brackets])
- idea "[Exports no longer freeze on files over 2 GB]"; angle fix.
- concept: device "Life before and after"; form "Split screen to one"; spectacle "[the frozen progress bar unfreezes and races to 100%]".
- 1: spoken "[Exporting a big project used to freeze at ninety-nine percent.]" · onScreen "[Stuck at 99%]" · visual "[an export progress bar stuck at 99%, the cursor spinning]".
- 3: spoken "[The fix streams the file in chunks instead of loading it all at once.]" · onScreen "[Stream, don't load]" · visual "[src/export.ts, the hunk: '- const data = await readAll(file)' / '+ for await (const chunk of stream(file))' …]" · block "code-diff".
- last: spoken "[It ships in version [2.4], thanks to [Ana Ruiz] and [Tom Lee].]" · onScreen "[v2.4.0 · owner/repo]" · visual "[the version and repo land and hold]".
