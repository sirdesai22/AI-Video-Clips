import type { VideoEvent } from "@/lib/types";

export default function LogList({ events }: { events: VideoEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted">Nothing yet.</p>;
  return (
    <ol className="flex max-h-80 flex-col gap-1 overflow-y-auto font-mono text-xs">
      {events.map((e) => (
        <li key={e.id} className={e.kind === "error" ? "text-danger" : e.kind === "stage" ? "font-semibold" : "text-muted"}>
          {e.kind === "stage" ? `— ${e.text} —` : e.text}
        </li>
      ))}
    </ol>
  );
}
