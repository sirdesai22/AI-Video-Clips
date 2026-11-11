"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoDetail } from "@/lib/actions";
import type { Video, VideoEvent } from "@/lib/types";

export function useVideo(id: string) {
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [events, setEvents] = useState<VideoEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastStatus = useRef<string | null>(null);
  const lastScript = useRef<number | null>(null);
  const lastRender = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/videos/${id}`);
      if (!r.ok) { setError(r.status === 404 ? "This video doesn't exist." : "Couldn't load the video."); return; }
      setDetail(await r.json());
    } catch {
      setError("Couldn't load the video.");
    }
  }, [id]);

  useEffect(() => {
    // No direct refresh() here: the first SSE message always differs from the
    // null refs below, so it triggers the initial fetch (and the lint rule
    // forbids setState straight from an effect body).
    const es = new EventSource(`/api/videos/${id}/events`);
    es.onmessage = (m) => {
      const { video, events: evs } = JSON.parse(m.data) as { video: Video; events: VideoEvent[] };
      if (evs.length) setEvents((prev) => [...prev, ...evs].slice(-800));
      setDetail((d) => (d ? { ...d, video } : d));
      const changed =
        video.status !== lastStatus.current ||
        video.scriptVersion !== lastScript.current ||
        video.renderVersion !== lastRender.current;
      if (changed) {
        if (lastStatus.current === "building" && video.status === "ready" &&
            typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Your video is ready", { body: video.title ?? "" });
        }
        lastStatus.current = video.status;
        lastScript.current = video.scriptVersion;
        lastRender.current = video.renderVersion;
        void refresh();
      }
    };
    return () => es.close();
  }, [id, refresh]);

  return { detail, events, refresh, error };
}
