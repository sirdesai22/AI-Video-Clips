export type Format = "reel" | "explainer";
export type VideoStatus =
  | "scripting" | "script_ready" | "script_failed"
  | "queued" | "building" | "ready" | "failed" | "interrupted";
export type JobKind = "script" | "build";
export type JobState = "queued" | "running" | "done" | "failed";
export type EventKind = "stage" | "log" | "error";

export interface VideoOptions {
  tone?: string;
  length?: string;
  audience?: string;
  voice?: string;
  exactWording?: string;
  cta?: string;
}

export interface Video {
  id: string;
  format: Format;
  input: string;
  options: VideoOptions;
  title: string | null;
  status: VideoStatus;
  stage: string | null;
  progress: number;
  sessionId: string | null;
  error: string | null;
  scriptVersion: number;
  renderVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: number;
  videoId: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  state: JobState;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface VideoEvent { id: number; videoId: string; ts: string; kind: EventKind; text: string }
export interface Render { videoId: string; version: number; path: string; posterPath: string | null; durationS: number; createdAt: string }
export interface ScriptRow { videoId: string; version: number; script: unknown; note: string | null; createdAt: string }

/** payload of a "script" job */
export interface ScriptPayload { note?: string }
/** payload of a "build" job */
export interface BuildPayload { mode: "new" | "revise" | "retry"; request?: string }
