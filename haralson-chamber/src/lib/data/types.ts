/**
 * Core domain types for the Greater Haralson Chamber front end.
 *
 * These types are the contract between the UI and any data source.
 * The UI only ever sees these shapes — a live adapter (GrowthZone or a
 * replacement AMS) is responsible for mapping its own API responses
 * into them. See ./source.ts for the data source interface.
 */

/** A directory category, e.g. "Restaurants & Food". */
export interface Category {
  id: string;
  /** URL-safe identifier used in routes: /directory/category/[slug] */
  slug: string;
  name: string;
  description: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

/** Membership tier — display-only; billing lives in the AMS. */
export type MemberTier = "standard" | "silver" | "gold" | "legacy";

/** A member business in the directory. */
export interface Member {
  id: string;
  /** URL-safe identifier used in routes: /directory/[slug] */
  slug: string;
  name: string;
  /** Primary category slug (must match a Category.slug). */
  categorySlug: string;
  /** One-line summary shown on directory cards. */
  tagline: string;
  /** Longer description shown on the member profile page. */
  description: string;
  address: Address;
  phone: string;
  email?: string;
  website?: string;
  /** Display hours, free-form (e.g. "Mon–Fri 9am–5pm"). */
  hours?: string;
  tier: MemberTier;
  /** Year the business joined the chamber. */
  memberSince: number;
  /** Featured members can be highlighted on the home page. */
  featured?: boolean;
  /** Search keywords beyond the name/category (e.g. "bbq", "catering"). */
  tags?: string[];
  /** Optional logo/photo URL. When absent the UI renders a placeholder. */
  imageUrl?: string;
}

export type EventCategory =
  | "networking"
  | "ribbon-cutting"
  | "workshop"
  | "community"
  | "fundraiser";

/** A chamber or community event. */
export interface ChamberEvent {
  id: string;
  /** URL-safe identifier used in routes: /events/[slug] */
  slug: string;
  title: string;
  category: EventCategory;
  /** ISO 8601 start, local to America/New_York (e.g. "2026-07-16T11:30:00"). */
  start: string;
  /** ISO 8601 end, optional for open-ended listings. */
  end?: string;
  venue: string;
  address?: Address;
  /** Short summary for list/calendar views. */
  summary: string;
  /** Full description for the event page. Paragraphs separated by "\n\n". */
  description: string;
  /** Display cost (e.g. "Free", "$15 members / $25 guests"). */
  cost?: string;
  /** External registration link (registration itself stays in the AMS). */
  registrationUrl?: string;
  imageUrl?: string;
}

export type JobType = "full-time" | "part-time" | "contract" | "seasonal";

/** A job posting from a member business. */
export interface Job {
  id: string;
  /** URL-safe identifier used in routes: /jobs/[slug] */
  slug: string;
  title: string;
  /** Display name of the hiring business. */
  company: string;
  /** Optional link back to the member's directory profile. */
  memberSlug?: string;
  location: string;
  type: JobType;
  /** Display pay range (e.g. "$18–$22/hr"). */
  pay?: string;
  /** Short summary for the list view. */
  summary: string;
  /** Full description. Paragraphs separated by "\n\n". */
  description: string;
  /** ISO 8601 date the posting went live. */
  postedAt: string;
  /** How to apply: URL or mailto target shown on the job page. */
  applyUrl?: string;
  applyEmail?: string;
}

export type NewsType = "news" | "spotlight";

/** A news article or member spotlight. */
export interface NewsPost {
  id: string;
  /** URL-safe identifier used in routes: /news/[slug] */
  slug: string;
  title: string;
  type: NewsType;
  /** ISO 8601 publish date. */
  publishedAt: string;
  author: string;
  /** Short teaser for list views and meta descriptions. */
  excerpt: string;
  /** Article body. Paragraphs separated by "\n\n". */
  body: string;
  /** For spotlights, the member being featured. */
  memberSlug?: string;
  imageUrl?: string;
}

/** Optional filters accepted by getMembers. All filtering also works
 *  client-side; these exist so a live adapter can push filtering to
 *  the API when one is connected. */
export interface MemberQuery {
  categorySlug?: string;
  /** Free-text search across name, tagline, and tags. */
  search?: string;
  featured?: boolean;
}

/** Optional filters accepted by getEvents. */
export interface EventQuery {
  category?: EventCategory;
  /** Only events starting on/after this ISO date. */
  from?: string;
  /** Only events starting on/before this ISO date. */
  to?: string;
}
