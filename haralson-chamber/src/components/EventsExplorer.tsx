"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ChamberEvent, EventCategory } from "@/lib/data";
import { eventCategoryLabels, formatMonth, formatTime } from "@/lib/format";
import { EventCard } from "./EventCard";

interface EventsExplorerProps {
  /** All events, sorted by start ascending (the server page handles that). */
  events: ChamberEvent[];
}

const ALL_CATEGORIES = Object.keys(eventCategoryLabels) as EventCategory[];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Events browser: list view grouped by month, or a month-grid calendar with
 * prev/next navigation, both filterable by category. Default month comes
 * from the earliest event so server and client render identically.
 */
export function EventsExplorer({ events }: EventsExplorerProps) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [category, setCategory] = useState<EventCategory | "">("");

  const firstStart = events[0] ? new Date(events[0].start) : new Date(2026, 0, 1);
  const [year, setYear] = useState(firstStart.getFullYear());
  const [month, setMonth] = useState(firstStart.getMonth());

  const filtered = useMemo(
    () => (category ? events.filter((e) => e.category === category) : events),
    [events, category],
  );

  const byMonth = useMemo(() => {
    const groups = new Map<string, ChamberEvent[]>();
    for (const e of filtered) {
      const d = new Date(e.start);
      const key = formatMonth(d.getFullYear(), d.getMonth());
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(e);
    }
    return groups;
  }, [filtered]);

  const monthEvents = useMemo(() => {
    const map = new Map<number, ChamberEvent[]>();
    for (const e of filtered) {
      const d = new Date(e.start);
      if (d.getFullYear() === year && d.getMonth() === month) {
        (map.get(d.getDate()) ?? map.set(d.getDate(), []).get(d.getDate())!).push(e);
      }
    }
    return map;
  }, [filtered, year, month]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="View"
          className="inline-flex rounded-lg border border-sand-300 bg-white p-1"
        >
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                view === v ? "bg-pine-800 text-cream" : "text-ink-soft hover:text-pine-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="event-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="event-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory | "")}
            className="rounded-md border border-sand-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All event types</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {eventCategoryLabels[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "list" ? (
        filtered.length > 0 ? (
          <div className="mt-6 space-y-8">
            {[...byMonth.entries()].map(([label, group]) => (
              <section key={label} aria-label={label}>
                <h2 className="font-display text-xl font-semibold text-pine-900">
                  {label}
                </h2>
                <div className="mt-3 space-y-4">
                  {group.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl border border-dashed border-sand-300 bg-white p-10 text-center text-ink-soft">
            No {category && `${eventCategoryLabels[category as EventCategory].toLowerCase()} `}
            events on the calendar right now — check back soon.
          </p>
        )
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-pine-900">
              {formatMonth(year, month)}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-md border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-pine-800 hover:bg-pine-50"
              >
                ← <span className="sr-only">Previous month</span>
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-md border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-pine-800 hover:bg-pine-50"
              >
                <span className="sr-only">Next month</span> →
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="min-w-[640px] overflow-hidden rounded-xl border border-sand-200 bg-white">
              <div className="grid grid-cols-7 border-b border-sand-200 bg-sand-50">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-soft"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => (
                  <div
                    key={i}
                    className={`min-h-24 border-b border-r border-sand-100 p-1.5 ${
                      day === null ? "bg-sand-50/50" : ""
                    }`}
                  >
                    {day !== null && (
                      <>
                        <p className="text-xs font-semibold text-ink-soft">{day}</p>
                        <div className="mt-1 space-y-1">
                          {(monthEvents.get(day) ?? []).map((e) => (
                            <Link
                              key={e.id}
                              href={`/events/${e.slug}`}
                              className="block truncate rounded bg-pine-100 px-1.5 py-1 text-xs font-medium text-pine-900 hover:bg-pine-200"
                              title={e.title}
                            >
                              {formatTime(e.start)} {e.title}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {monthEvents.size === 0 && (
            <p className="mt-4 text-center text-sm text-ink-soft">
              Nothing scheduled in {formatMonth(year, month)} — use the arrows to browse.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
