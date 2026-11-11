import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { customAlphabet } from "nanoid";
import { dbPath } from "./paths";
import type {
  EventKind, Format, Job, JobKind, Render, ScriptRow, Video, VideoEvent, VideoOptions, VideoStatus,
} from "./types";

const newId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
const now = () => new Date().toISOString();
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const p = dbPath();
  if (p !== ":memory:") fs.mkdirSync(path.dirname(p), { recursive: true });
  db = new Database(p);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY, format TEXT NOT NULL, input TEXT NOT NULL, options TEXT NOT NULL,
      title TEXT, status TEXT NOT NULL, stage TEXT, progress INTEGER NOT NULL DEFAULT 0,
      session_id TEXT, error TEXT, script_version INTEGER NOT NULL DEFAULT 0,
      render_version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scripts (
      video_id TEXT NOT NULL, version INTEGER NOT NULL, json TEXT NOT NULL, note TEXT,
      created_at TEXT NOT NULL, PRIMARY KEY (video_id, version));
    CREATE TABLE IF NOT EXISTS renders (
      video_id TEXT NOT NULL, version INTEGER NOT NULL, path TEXT NOT NULL, poster_path TEXT,
      duration_s REAL NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (video_id, version));
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, video_id TEXT NOT NULL, kind TEXT NOT NULL,
      payload TEXT NOT NULL, state TEXT NOT NULL, started_at TEXT, finished_at TEXT);
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, video_id TEXT NOT NULL, ts TEXT NOT NULL,
      kind TEXT NOT NULL, text TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS events_video ON events (video_id, id);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  return db;
}

export function closeDb() {
  db?.close();
  db = null;
}

type Row = Record<string, unknown>;

function toVideo(r: Row): Video {
  return {
    id: r.id as string,
    format: r.format as Format,
    input: r.input as string,
    options: JSON.parse(r.options as string) as VideoOptions,
    title: (r.title as string) ?? null,
    status: r.status as VideoStatus,
    stage: (r.stage as string) ?? null,
    progress: r.progress as number,
    sessionId: (r.session_id as string) ?? null,
    error: (r.error as string) ?? null,
    scriptVersion: r.script_version as number,
    renderVersion: r.render_version as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function toJob(r: Row): Job {
  return {
    id: r.id as number,
    videoId: r.video_id as string,
    kind: r.kind as JobKind,
    payload: JSON.parse(r.payload as string),
    state: r.state as Job["state"],
    startedAt: (r.started_at as string) ?? null,
    finishedAt: (r.finished_at as string) ?? null,
  };
}

export function createVideo(v: { format: Format; input: string; options: VideoOptions }): Video {
  const id = newId();
  const t = now();
  getDb()
    .prepare(`INSERT INTO videos (id, format, input, options, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'scripting', ?, ?)`)
    .run(id, v.format, v.input, JSON.stringify(v.options), t, t);
  return getVideo(id)!;
}

export function getVideo(id: string): Video | null {
  const r = getDb().prepare(`SELECT * FROM videos WHERE id = ?`).get(id) as Row | undefined;
  return r ? toVideo(r) : null;
}

export function listVideos(limit = 30): Video[] {
  return (getDb().prepare(`SELECT * FROM videos ORDER BY created_at DESC LIMIT ?`).all(limit) as Row[]).map(toVideo);
}

export type VideoPatch = Partial<Pick<Video,
  "title" | "status" | "stage" | "progress" | "sessionId" | "error" | "scriptVersion" | "renderVersion">>;

const COLS: Record<keyof VideoPatch, string> = {
  title: "title", status: "status", stage: "stage", progress: "progress", sessionId: "session_id",
  error: "error", scriptVersion: "script_version", renderVersion: "render_version",
};

export function updateVideo(id: string, patch: VideoPatch): Video {
  const keys = Object.keys(patch) as (keyof VideoPatch)[];
  if (keys.length) {
    const sets = keys.map((k) => `${COLS[k]} = ?`).join(", ");
    getDb()
      .prepare(`UPDATE videos SET ${sets}, updated_at = ? WHERE id = ?`)
      .run(...keys.map((k) => patch[k] ?? null), now(), id);
  }
  const v = getVideo(id);
  if (!v) throw new Error(`video ${id} not found`);
  return v;
}

export function addScript(videoId: string, script: unknown, note: string | null): number {
  const d = getDb();
  const next = ((d.prepare(`SELECT MAX(version) AS m FROM scripts WHERE video_id = ?`).get(videoId) as Row).m as number ?? 0) + 1;
  d.prepare(`INSERT INTO scripts (video_id, version, json, note, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(videoId, next, JSON.stringify(script), note, now());
  return next;
}

export function getScript(videoId: string, version?: number): ScriptRow | null {
  const r = (version === undefined
    ? getDb().prepare(`SELECT * FROM scripts WHERE video_id = ? ORDER BY version DESC LIMIT 1`).get(videoId)
    : getDb().prepare(`SELECT * FROM scripts WHERE video_id = ? AND version = ?`).get(videoId, version)) as Row | undefined;
  return r ? {
    videoId, version: r.version as number, script: JSON.parse(r.json as string),
    note: (r.note as string) ?? null, createdAt: r.created_at as string,
  } : null;
}

export function listScripts(videoId: string): Omit<ScriptRow, "script">[] {
  return (getDb().prepare(`SELECT version, note, created_at FROM scripts WHERE video_id = ? ORDER BY version`).all(videoId) as Row[])
    .map((r) => ({ videoId, version: r.version as number, note: (r.note as string) ?? null, createdAt: r.created_at as string }));
}

export function addRender(videoId: string, r: { path: string; posterPath: string | null; durationS: number }): number {
  const d = getDb();
  const next = ((d.prepare(`SELECT MAX(version) AS m FROM renders WHERE video_id = ?`).get(videoId) as Row).m as number ?? 0) + 1;
  d.prepare(`INSERT INTO renders (video_id, version, path, poster_path, duration_s, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(videoId, next, r.path, r.posterPath, r.durationS, now());
  return next;
}

export function listRenders(videoId: string): Render[] {
  return (getDb().prepare(`SELECT * FROM renders WHERE video_id = ? ORDER BY version`).all(videoId) as Row[]).map((r) => ({
    videoId, version: r.version as number, path: r.path as string, posterPath: (r.poster_path as string) ?? null,
    durationS: r.duration_s as number, createdAt: r.created_at as string,
  }));
}

export function enqueueJob(videoId: string, kind: JobKind, payload: object = {}): Job {
  const info = getDb()
    .prepare(`INSERT INTO jobs (video_id, kind, payload, state) VALUES (?, ?, ?, 'queued')`)
    .run(videoId, kind, JSON.stringify(payload));
  return toJob(getDb().prepare(`SELECT * FROM jobs WHERE id = ?`).get(info.lastInsertRowid) as Row);
}

export function claimNextJob(): Job | null {
  const d = getDb();
  return d.transaction(() => {
    const r = d.prepare(`SELECT * FROM jobs WHERE state = 'queued' ORDER BY id LIMIT 1`).get() as Row | undefined;
    if (!r) return null;
    const t = now();
    d.prepare(`UPDATE jobs SET state = 'running', started_at = ? WHERE id = ?`).run(t, r.id);
    return toJob({ ...r, state: "running", started_at: t });
  })();
}

export function finishJob(id: number, state: "done" | "failed"): void {
  getDb().prepare(`UPDATE jobs SET state = ?, finished_at = ? WHERE id = ?`).run(state, now(), id);
}

export function markInterrupted(): number {
  const d = getDb();
  const running = d.prepare(`SELECT * FROM jobs WHERE state = 'running'`).all() as Row[];
  for (const r of running) {
    finishJob(r.id as number, "failed");
    updateVideo(r.video_id as string, {
      status: r.kind === "script" ? "script_failed" : "interrupted",
      error: "Stopped because the app restarted",
    });
  }
  return running.length;
}

export function addEvent(videoId: string, kind: EventKind, text: string): void {
  getDb().prepare(`INSERT INTO events (video_id, ts, kind, text) VALUES (?, ?, ?, ?)`).run(videoId, now(), kind, text.slice(0, 4000));
}

export function listEvents(videoId: string, afterId = 0, limit = 500): VideoEvent[] {
  return (getDb().prepare(`SELECT * FROM events WHERE video_id = ? AND id > ? ORDER BY id LIMIT ?`).all(videoId, afterId, limit) as Row[])
    .map((r) => ({ id: r.id as number, videoId, ts: r.ts as string, kind: r.kind as EventKind, text: r.text as string }));
}

export function getSetting(key: string): string | null {
  const r = getDb().prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as Row | undefined;
  return r ? (r.value as string) : null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
}
