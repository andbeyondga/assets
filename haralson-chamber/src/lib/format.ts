import type { EventCategory, JobType, MemberTier, NewsType } from "@/lib/data";

/* Formatting helpers shared across pages. Event times in the seed data are
 * timezone-less ISO strings ("2026-07-16T11:30:00") representing local wall
 * time, so Date parses them consistently on server and client. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toLowerCase()
    .replace(" ", "");
}

export function formatTimeRange(start: string, end?: string): string {
  return end ? `${formatTime(start)}–${formatTime(end)}` : formatTime(start);
}

/** "July 2026" label for calendar navigation. */
export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export const eventCategoryLabels: Record<EventCategory, string> = {
  networking: "Networking",
  "ribbon-cutting": "Ribbon Cutting",
  workshop: "Workshop",
  community: "Community",
  fundraiser: "Fundraiser",
};

export const jobTypeLabels: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  seasonal: "Seasonal",
};

export const memberTierLabels: Record<MemberTier, string> = {
  standard: "Member",
  silver: "Silver Member",
  gold: "Gold Member",
  legacy: "Legacy Member",
};

export const newsTypeLabels: Record<NewsType, string> = {
  news: "Chamber News",
  spotlight: "Member Spotlight",
};

/** Split a "\n\n"-delimited body into paragraphs for rendering. */
export function paragraphs(body: string): string[] {
  return body.split(/\n\n+/).filter(Boolean);
}

/** Initials for photo placeholders, e.g. "The Mill Table" -> "MT". */
export function initials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter((w) => w && !["the", "of", "and", "a", "an"].includes(w.toLowerCase()));
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
