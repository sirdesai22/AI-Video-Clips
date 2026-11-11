import type { VideoStatus } from "@/lib/types";

const LABELS: Record<VideoStatus, string> = {
  scripting: "Writing script",
  script_ready: "Needs approval",
  script_failed: "Script failed",
  queued: "Waiting",
  building: "Building",
  ready: "Ready",
  failed: "Failed",
  interrupted: "Interrupted",
};

export function StatusChip({ status, progress }: { status: VideoStatus; progress?: number }) {
  const tone =
    status === "ready" ? "text-accent" :
    status === "failed" || status === "script_failed" || status === "interrupted" ? "text-danger" :
    status === "script_ready" ? "text-warn" : "text-muted";
  return (
    <span className={`text-sm font-medium ${tone}`}>
      {LABELS[status]}{status === "building" && progress ? ` ${progress}%` : ""}
    </span>
  );
}

export function Disclosure({ summary, children, defaultOpen }: { summary: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-base font-medium">
        {summary}
        <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-line px-5 py-4">{children}</div>
    </details>
  );
}

export function BottomBar({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex gap-3">{children}</div>;
}
