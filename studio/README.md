# Reel Studio

Turn links, a story or a topic into a finished Reel (9:16) or Explainer (16:9). Runs on this Mac and opens in your browser at http://localhost:3000.

## First time
1. `cd studio && npm install && npm run setup`
2. Make sure Claude Code works headless: run `claude` once in a terminal and use `/login` if asked. Check it with `claude -p "Reply with OK." < /dev/null`.
3. For music (optional): `npx hyperframes auth login` (free HeyGen account).
4. `npm run build && npm start`
5. Open http://localhost:3000

## Day to day
`npm start` runs the web app and the worker. Finished videos are in `studio/videos/<id>/project/renders/`.

## Develop
- `npm run dev:all`: dev server and worker, with reload
- `AGENT=fake npm run dev:all`: no Claude calls; replays a recorded run
- `npm test`: unit tests
- `npm run e2e`: end-to-end tests
