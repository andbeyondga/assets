import type {
  Category,
  ChamberEvent,
  EventQuery,
  Job,
  Member,
  MemberQuery,
  NewsPost,
} from "./types";

/**
 * The single seam between the UI and wherever chamber data lives.
 *
 * Every page and component fetches through this interface — never from
 * JSON files or HTTP endpoints directly. Swapping the mock seed data for
 * a live GrowthZone (or replacement AMS) connection means writing one
 * adapter class and flipping the DATA_SOURCE env var; no UI changes.
 *
 * All methods are async even though the mock source is synchronous
 * under the hood, so a network-backed adapter drops in cleanly.
 *
 * This front end is READ ONLY. There are intentionally no create/update
 * methods here — payments, dues, and member records stay in the AMS.
 */
export interface ChamberDataSource {
  /** All members, optionally filtered. Sorted by name. */
  getMembers(query?: MemberQuery): Promise<Member[]>;

  /** A single member by slug, or null if not found. */
  getMember(slug: string): Promise<Member | null>;

  /** All directory categories, sorted by name. */
  getCategories(): Promise<Category[]>;

  /** All events, optionally filtered. Sorted by start date ascending. */
  getEvents(query?: EventQuery): Promise<ChamberEvent[]>;

  /** A single event by slug, or null if not found. */
  getEvent(slug: string): Promise<ChamberEvent | null>;

  /** All open job postings. Sorted by posted date, newest first. */
  getJobs(): Promise<Job[]>;

  /** A single job by slug, or null if not found. */
  getJob(slug: string): Promise<Job | null>;

  /** All news posts and spotlights. Sorted by publish date, newest first. */
  getNews(): Promise<NewsPost[]>;

  /** A single news post by slug, or null if not found. */
  getNewsPost(slug: string): Promise<NewsPost | null>;
}
