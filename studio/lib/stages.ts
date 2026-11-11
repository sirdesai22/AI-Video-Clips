export const STAGES = [
  { name: "voice", label: "Recording voice", weight: 10 },
  { name: "music", label: "Adding music", weight: 10 },
  { name: "look", label: "Designing the look", weight: 5 },
  { name: "scenes", label: "Building scenes", weight: 45 },
  { name: "check", label: "Checking frames", weight: 15 },
  { name: "render", label: "Rendering", weight: 15 },
] as const;

export type StageName = (typeof STAGES)[number]["name"];

export interface ParsedLine {
  sessionId?: string;
  texts: string[];
  tools: string[];
  stage?: StageName;
  result?: { isError: boolean; text: string };
}

export const stageIndex = (name: string) => STAGES.findIndex((s) => s.name === name);

export function stageLabel(name: string): string {
  return STAGES.find((s) => s.name === name)?.label ?? "Working";
}

export function progressAtStart(name: StageName): number {
  let acc = 0;
  for (const s of STAGES) {
    if (s.name === name) return acc;
    acc += s.weight;
  }
  return 0;
}

const MARKER = /STAGE:\s*(voice|music|look|scenes|check|render)\b/i;

function inferFromCommand(cmd: string): StageName | undefined {
  if (/hyperframes\s+tts\b/.test(cmd)) return "voice";
  if (/hyperframes\s+render\b/.test(cmd)) return "render";
  if (/hyperframes\s+(check|snapshot)\b/.test(cmd)) return "check";
  return undefined;
}

function summarize(name: string, input: Record<string, unknown>): string {
  const detail = input.command ?? input.file_path ?? input.url ?? input.pattern ?? input.skill ?? "";
  return `${name}: ${String(detail)}`.slice(0, 240);
}

export function parseStreamLine(line: string): ParsedLine {
  const out: ParsedLine = { texts: [], tools: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let msg: Record<string, any>;
  try { msg = JSON.parse(line); } catch { return out; }
  if (!msg || typeof msg !== "object") return out;
  if (typeof msg.session_id === "string" && (msg.type === "system" || msg.type === "result")) {
    out.sessionId = msg.session_id;
  }
  if (msg.type === "assistant" && Array.isArray(msg.message?.content)) {
    for (const c of msg.message.content) {
      if (c?.type === "text" && typeof c.text === "string") {
        out.texts.push(c.text);
        const m = MARKER.exec(c.text);
        if (m) out.stage = m[1].toLowerCase() as StageName;
      } else if (c?.type === "tool_use") {
        const input = (c.input ?? {}) as Record<string, unknown>;
        out.tools.push(summarize(String(c.name), input));
        if (!out.stage && typeof input.command === "string") out.stage = inferFromCommand(input.command);
      }
    }
  }
  if (msg.type === "result") {
    out.result = { isError: !!msg.is_error, text: String(msg.result ?? "") };
  }
  return out;
}
