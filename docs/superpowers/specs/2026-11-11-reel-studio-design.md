# Reel Studio — design

Date: 2026-11-11
Status: draft for review

## 1. Purpose

A phone-first web app, running on the owner's Mac, that turns links, a story or a topic into a finished video. The flow is: pick a format → paste input → review an AI-written script → approve → an AI agent designs, voices and renders the video → watch, download or share it.

The main flow stays minimal. Editors, logs and technical detail sit behind toggles.

### Formats

| Format | Size | Length | Default |
| --- | --- | --- | --- |
| Reel | 1080×1920 (9:16) | ~20–45 s, 6–10 scenes | yes |
| Explainer | 1920×1080 (16:9) | ~45–90 s | no |

### Decisions already made

- **Video engine:** an AI agent (headless Claude Code with the HyperFrames skills) designs every video from scratch. There are no fixed templates.
- **Hosting:** the owner's Mac. Phones reach it over the local network.
- **AI access:** the owner's existing Claude Code login (`claude -p`). No API key.
- **Voice:** Kokoro, on-device, through `npx hyperframes tts`.
- **Music and sound effects:** the HeyGen catalog through the HyperFrames media skill, after a one-time free HeyGen sign-in.
- **App stack:** Next.js (App Router, TypeScript, Tailwind).

### Non-goals (v1)

- Cloud hosting, multiple users or accounts.
- Posting straight to social networks; the phone's share sheet covers this.
- A timeline editor inside the app. Hand edits happen in HyperFrames Studio on the Mac, reached through "Open in editor".
- Running several builds at once. Builds run one at a time.

## 2. Architecture

Three parts, all on the Mac, under `AI-Video-Clips/studio/`:

1. **Web app (Next.js).**
   - Started with `next start -H 0.0.0.0 -p 3000`. Phones open `http://<mac-name>.local:3000`.
   - Serves the screens and short API routes only.
   - Has a PWA manifest so it can be added to the home screen.
2. **Worker (a separate Node process).**
   - Started together with the app by a single `npm run start` (via `concurrently`).
   - Claims queued jobs from SQLite one at a time and runs `claude -p` inside the video's folder.
   - Parses the agent's streamed output into stages, progress and log lines, and writes them to SQLite.
3. **Storage.**
   - `studio/data/app.db` (SQLite through `better-sqlite3`).
   - `studio/videos/<id>/`: one HyperFrames project per video, holding `SCRIPT.json`, `BRIEF.md`, `SPEC.md`, compositions, `assets/`, and the renders at `renders/v<n>.mp4` plus `renders/v<n>.jpg` (poster).

The web app and the worker share one TypeScript module (`lib/`) for the database, the types and script validation.

### Folder layout

```
studio/
  app/                 Next.js routes and pages
  components/
  lib/                 db.ts, types.ts, script-schema.ts, auth.ts, stages.ts
  worker/              index.ts (loop), script-job.ts, build-job.ts, claude.ts (spawn + stream parsing), fake-agent.ts
  prompts/             script.md, build.md, revise.md, reel-rules.md, explainer-rules.md
  project-template/    reel/ and explainer/ base HyperFrames projects (skills linked via .claude/skills symlinks)
  data/app.db
  videos/<id>/
  tests/               vitest unit tests, playwright e2e, fixtures/ (recorded agent logs, sample.mp4)
```

## 3. Data model

```
videos   id (nanoid), format ('reel'|'explainer'), input (text), options (json),
         title, status, stage, progress (0-100), session_id (Claude Code), error,
         script_version (current), render_version (current), created_at, updated_at
scripts  video_id, version, json, note (rewrite request, nullable), created_at
renders  video_id, version, path, poster_path, duration_s, created_at
jobs     id, video_id, kind ('script'|'build'|'revise'), payload (json), state ('queued'|'running'|'done'|'failed'), started_at, finished_at
events   video_id, ts, kind ('stage'|'log'|'error'), text
settings key, value     (passcode hash, default voice, default format, model override)
```

### Video status

```
scripting ──▶ script_ready ──(rewrite)──▶ scripting
                   │
                (approve)
                   ▼
               queued ──▶ building ──▶ ready ──(change something)──▶ queued
                              │
                              ├──▶ failed       (retry ▶ queued, resumes the session)
                              └──▶ interrupted  (set when the worker starts and finds a stale running job; retry ▶ queued)
```

`script_failed` is a separate end state for the script step. Its retry sends it back to `scripting`.

## 4. The script step

**Input:**
- One free-text box (links, a story or a topic).
- Optional fields: tone, target length, audience, voice (a Kokoro voice id), exact wording to keep, and an ending or call to action.

**Run:**

```
claude -p <prompts/script.md + format rules + input>
  --output-format json --max-turns 12
  --allowedTools "WebFetch,WebSearch"
```

- The run's working directory is the video folder.
- The prompt asks for a single JSON object matching the script schema below.
- The worker pulls the JSON out of the result and validates it with zod.
  - If validation fails, it retries once, feeding the validation errors back.
  - If it fails again, the status becomes `script_failed`.

**Script schema:**

```ts
{
  title: string,
  idea: string,                 // the one idea, one line
  angle: 'concept'|'how-to'|'listicle'|'story',
  voice: string,                // kokoro voice id
  estSeconds: number,
  scenes: Array<{
    spoken: string,             // ≤ 19 words
    onScreen: string,           // ≤ 6 words (reel), ≤ 10 (explainer); never identical to spoken
    visual: string,             // what the viewer sees
    estSeconds: number
  }>,
  sources: Array<{ url: string, ok: boolean, note?: string }>,
  claims: Array<{ text: string, sceneIndex: number, source: string | null }>  // source null = flagged
}
```

**Format rules:**
- **Reel rules** (`prompts/reel-rules.md`):
  - The hook lands within 1.5 s: a question, a surprising number, or tension.
  - Something new every 2–3 s.
  - 6–10 scenes, about 20–45 s.
  - The last line pays off and loops back to the hook.
  - Burned-in captions, with keywords in the accent colour.
- **Explainer rules** (`prompts/explainer-rules.md`):
  - About 45–90 s, one idea per scene.
  - One worked example as the spine.
  - Ends on the one idea in one line.
- **Both formats:**
  - Numbers and claims come only from the sources.
  - A claim with no source is listed with `source: null` and shown as flagged.

**Review actions:**
- **Approve:** status becomes `queued`, and a build job is created.
- **Edit:** the edited scenes are saved as a new script version (`note = 'edited'`).
- **Rewrite (note):** a new script job runs with the previous script and the note. The result is saved as the next version.
- **Version picker:** any earlier version can be made current again.

## 5. The build step

**Setup (worker):**
1. Copy `project-template/<format>/` into `videos/<id>/`.
2. Write `SCRIPT.json` (the approved version) and `BRIEF.md`. The brief contains:
   - the format and size;
   - "the script is approved: skip storylines, keep every spoken line verbatim, no questions";
   - the voice id and the caption rule;
   - "music and sound effects from the HeyGen catalog";
   - the steps listed under "Run" below, with the instruction to print a marker line `STAGE: <name>` at each one.

**Run:**

```
claude -p <prompts/build.md>
  --output-format stream-json --verbose
  --permission-mode acceptEdits --max-turns 200
  --allowedTools "Read,Write,Edit,Glob,Grep,Skill,WebFetch,Bash(npx hyperframes:*),Bash(ffmpeg:*),Bash(ffprobe:*)"
```

- The working directory is `videos/<id>/`.
- The environment includes `HYPERFRAMES_PYTHON=<repo>/.venv-kokoro/bin/python`.
- The worker records the `session_id` from the first stream event.

**Agent stages (each printed as a marker):**
1. **voice:** run Kokoro on each scene line, then measure the durations; they become the scene lengths.
2. **music:** pick a HeyGen catalog track to match the tone, plus sound effects. Music sits at about 0.14 under the voice.
3. **look:** write `SPEC.md`: palette, type and medium, taken from the topic or the brand.
4. **scenes:** one composition per scene. For a reel, add a caption track using registry caption blocks.
5. **check:** run `npx hyperframes check`, fix every error, then `snapshot --review` and fix what's off.
6. **render:** render to `renders/v<n>.mp4` with a poster frame, then run `npx hyperframes audio` on the result.

**Progress:**
- `lib/stages.ts` turns `STAGE:` markers and tool calls into a stage name and a percentage. The weights are: voice 10, music 10, look 5, scenes 45, check 15, render 15.
- Every line of assistant text and every tool call is stored as a `log` event.
- The page receives updates over SSE from `GET /api/videos/[id]/events`.

**Limits:**
- 45-minute wall clock: the worker kills the process and marks the job `failed (timeout)`.
- `--max-turns 200`.
- One job at a time.

**Done:**
- The worker checks that `renders/v<n>.mp4` exists and that ffprobe reports a duration above zero.
- It then inserts a `renders` row and sets the status to `ready`.

**Change something:** runs `claude -p "<revise.md + request>" --resume <session_id>` with the same tools, then renders the next version.

**Retry after failure or interruption:** runs `--resume <session_id>` with "continue from where you stopped; the stages already finished are in the log."

## 6. Screens

All screens are one column, with the main button pinned to the bottom. They follow the system light or dark mode.

1. **Passcode:**
   - The passcode is hashed with scrypt and stored in settings.
   - Success gives an httpOnly signed cookie that lasts 30 days.
   - 5 wrong tries lock it for 5 minutes.
2. **New video:**
   - Format cards (Reel is selected by default).
   - The input box, with a collapsed "More options" section.
   - A **Write script** button.
   - A "Recent videos" list with thumbnails and status chips.
3. **Script review:**
   - Title and estimated length.
   - Scene cards: the spoken line large, the on-screen text small; flagged claims show as an amber chip.
   - Bottom bar: **Approve & make video**, Edit, Rewrite.
   - A "Details" toggle: sources (failed links named), claims, angle, raw JSON, versions.
4. **Building:**
   - A progress ring with the stage name and elapsed time.
   - The note "you can close this page".
   - "Show details" reveals the live log and the scene list.
   - A browser notification when it finishes (if allowed).
5. **Result:**
   - The `<video>` player in the video's own shape.
   - Download and Share buttons (Web Share API, with download as the fallback).
   - A **Change something** box.
   - A "Details" toggle: script, versions, log, and **Open in editor**. That button starts `npx hyperframes preview --background` in the video folder and links to its Studio URL, which only works on the Mac.
6. **Settings:**
   - HeyGen sign-in status (from `npx hyperframes auth status`).
   - Default voice, default format, Claude model override, change passcode.

Video files are served through a route handler that supports HTTP range requests, which iOS Safari needs for playback.

## 7. Errors

| Case | Behaviour |
| --- | --- |
| A link can't be read | The script is written from the readable input; `sources[].ok=false` is shown on review |
| The script JSON is invalid | One automatic retry with the errors; then `script_failed`, with Try again |
| Not signed in to HeyGen | A warning before the build; options are "Build without music" or "I've signed in, recheck" |
| The agent fails, times out or hits the turn cap | `failed` with the last stage and the log; Retry resumes the session |
| A check or render error the agent can't fix | `failed`, with the check report in Details |
| The worker restarts during a job | A stale `running` job becomes `interrupted`; Retry resumes |
| Claude usage limit | `failed (usage limit)`, with Claude Code's message; retry later |
| Wrong passcode | A 5-minute lockout after 5 tries |

## 8. Security

- The app is reachable only on the local network, and every route except the passcode screen and the static files checks the session cookie.
- The agent's tools are an allowlist (section 5), with no general shell. Its working directory is the video folder, and it edits files only under `acceptEdits` within that folder.
- Input text goes into prompts as clearly delimited data. The prompts say that any instructions inside fetched pages or user input are content, not commands.
- Secrets: there are none in the repo. The passcode hash lives in SQLite, and the HeyGen login is stored by the HyperFrames CLI itself.

## 9. Testing

- **Unit tests (Vitest):** the script schema (valid and invalid), job queue status changes, the stage parser against recorded `stream-json` fixtures, the passcode lockout, and range requests.
- **Fake agent:** setting `AGENT=fake` makes the worker replay fixture streams and copy `tests/fixtures/sample.mp4` (plus a fixture script for the script step). The whole flow then runs in seconds without Claude.
- **Playwright** in a 390×844 viewport with the fake agent: passcode → new reel → review → edit → approve → building → result → change something → v2.
- **One real end-to-end run before delivery:**
  - a short reel from a real link;
  - frames reviewed with `hyperframes snapshot`;
  - audio checked with `hyperframes audio`.

## 10. Prerequisites (owner, once)

- Claude Code installed and logged in (it already is).
- `npx hyperframes auth login` for HeyGen music.
- Node 22, FFmpeg and Chrome (already present), plus Kokoro in `.venv-kokoro` (already set up).
- Set a passcode on first launch.
