"use client";
import { useVideo } from "./useVideo";
import ScriptReview from "./ScriptReview";
import BuildProgress from "./BuildProgress";
import ResultView from "./ResultView";
import FailedView from "./FailedView";

export default function VideoView({ id }: { id: string }) {
  const { detail, events, refresh, error } = useVideo(id);
  if (error) return <p className="py-10 text-center text-muted">{error}</p>;
  if (!detail) return <p className="py-10 text-center text-muted">Loading…</p>;
  const { video } = detail;
  switch (video.status) {
    case "script_ready":
      return <ScriptReview detail={detail} onChange={refresh} />;
    case "ready":
      return <ResultView detail={detail} events={events} onChange={refresh} />;
    case "failed":
    case "interrupted":
    case "script_failed":
      return <FailedView video={video} events={events} onChange={refresh} />;
    default:
      return <BuildProgress video={video} events={events} scenes={detail.script?.script.scenes.map((s) => s.onScreen) ?? []} />;
  }
}
