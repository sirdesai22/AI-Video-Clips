"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusChip } from "./ui";
import type { Video } from "@/lib/types";

type Row = Video & { posterUrl: string | null };

export default function RecentVideos() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    const load = () => fetch("/api/videos").then((r) => r.json()).then((d) => setRows(d.videos)).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);
  if (!rows?.length) return null;
  return (
    <section className="mt-14 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Recent videos</h2>
      {rows.map((v) => (
        <Link key={v.id} href={`/v/${v.id}`} className="card flex items-center gap-4 transition hover:border-muted">
          <div className={`shrink-0 overflow-hidden rounded-lg bg-line ${v.format === "reel" ? "h-20 w-[45px]" : "h-[45px] w-20"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {v.posterUrl && <img src={v.posterUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-medium">{v.title ?? v.input.slice(0, 80)}</div>
            <StatusChip status={v.status} progress={v.progress} />
          </div>
        </Link>
      ))}
    </section>
  );
}
