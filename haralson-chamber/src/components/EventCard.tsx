import Link from "next/link";
import type { ChamberEvent } from "@/lib/data";
import { eventCategoryLabels, formatTimeRange } from "@/lib/format";
import { Badge } from "./Badge";

const TONES: Record<ChamberEvent["category"], "pine" | "clay" | "sand" | "gold"> = {
  networking: "pine",
  "ribbon-cutting": "clay",
  workshop: "gold",
  community: "sand",
  fundraiser: "clay",
};

export function EventCard({ event }: { event: ChamberEvent }) {
  const start = new Date(event.start);
  return (
    <article className="group relative flex gap-5 rounded-xl border border-sand-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-pine-800 text-cream"
        aria-hidden
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {start.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="font-display text-2xl font-semibold leading-none">
          {start.getDate()}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONES[event.category]}>
            {eventCategoryLabels[event.category]}
          </Badge>
          <span className="text-sm text-ink-soft">
            {formatTimeRange(event.start, event.end)}
          </span>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-pine-900">
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0"
          >
            {event.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">{event.venue}</p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink">
          {event.summary}
        </p>
      </div>
    </article>
  );
}
