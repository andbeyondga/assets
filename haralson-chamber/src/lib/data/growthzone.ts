/* eslint-disable @typescript-eslint/no-unused-vars -- stub methods keep the
   full interface signatures visible for whoever implements them */
import type { ChamberDataSource } from "./source";
import type {
  Category,
  ChamberEvent,
  EventQuery,
  Job,
  Member,
  MemberQuery,
  NewsPost,
} from "./types";

/* =============================================================================
 * LIVE DATA ADAPTER (STUB)
 * =============================================================================
 * This adapter is where a live data connection plugs in later — either the
 * GrowthZone API the chamber already has, or a replacement AMS.
 *
 * HOW TO WIRE IT UP:
 *
 * 1. Set the environment variables (e.g. in .env.local — never commit them):
 *
 *      DATA_SOURCE=live
 *      AMS_API_BASE_URL=https://api.growthzoneapp.com   # <-- your API base URL
 *      AMS_API_KEY=xxxxxxxxxxxx                          # <-- your API key/token
 *
 * 2. Fill in each method below: fetch from the endpoint, then MAP the raw
 *    response into the shared types from ./types. The mapping functions are
 *    the whole job — the UI never sees a raw AMS payload.
 *
 * 3. If the AMS can't filter server-side, fetch everything and reuse the
 *    filtering logic from mock.ts.
 *
 * GROWTHZONE NOTES (for when that's the source):
 *   - API docs: https://developers.growthzoneapp.com
 *   - Auth is a bearer token: `Authorization: Bearer ${AMS_API_KEY}`
 *   - Rough endpoint mapping (verify against current docs):
 *       getMembers    -> GET /api/directory/listings
 *       getCategories -> GET /api/directory/categories
 *       getEvents     -> GET /api/events
 *       getJobs       -> GET /api/jobposting
 *       getNews       -> GET /api/news  (or the chamber's newsletter feed)
 *   - GrowthZone IDs are numeric; derive `slug` from the listing name
 *     (see slugify below) so existing front-end URLs keep working.
 *
 * CACHING: these fetches run inside Next.js server components, so use the
 * built-in fetch cache, e.g. fetch(url, { next: { revalidate: 3600 } }),
 * to keep pages fast and the AMS traffic low.
 * =============================================================================
 */

const API_BASE = process.env.AMS_API_BASE_URL;
const API_KEY = process.env.AMS_API_KEY;

/** Derive a stable URL slug from an AMS record name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Shared fetch helper for the live API. */
async function amsFetch(path: string): Promise<unknown> {
  if (!API_BASE || !API_KEY) {
    throw new Error(
      "Live data source selected but AMS_API_BASE_URL / AMS_API_KEY are not set. " +
        "Add them to .env.local, or set DATA_SOURCE=mock to use seed data.",
    );
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    },
    // Revalidate hourly; tune per resource once real traffic exists.
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`AMS request failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json();
}

const NOT_IMPLEMENTED =
  "GrowthZoneDataSource is a stub. Implement the method by fetching from the " +
  "AMS endpoint and mapping the response to the shared types (see comments in " +
  "src/lib/data/growthzone.ts), or run with DATA_SOURCE=mock.";

/**
 * Stub adapter for a live AMS (GrowthZone or replacement).
 * Implements the same interface as MockDataSource — swap via DATA_SOURCE env.
 */
export class GrowthZoneDataSource implements ChamberDataSource {
  async getMembers(_query?: MemberQuery): Promise<Member[]> {
    // TODO: const raw = await amsFetch("/api/directory/listings");
    // TODO: return (raw as GzListing[]).map(mapListingToMember);
    void amsFetch; // keeps the helper "used" until the TODOs above land
    throw new Error(NOT_IMPLEMENTED);
  }

  async getMember(_slug: string): Promise<Member | null> {
    // TODO: fetch the listing (by ID looked up from slug, or fetch-all + find)
    // and map with mapListingToMember. Return null when the AMS 404s.
    throw new Error(NOT_IMPLEMENTED);
  }

  async getCategories(): Promise<Category[]> {
    // TODO: const raw = await amsFetch("/api/directory/categories");
    throw new Error(NOT_IMPLEMENTED);
  }

  async getEvents(_query?: EventQuery): Promise<ChamberEvent[]> {
    // TODO: const raw = await amsFetch("/api/events");
    // Map start/end to ISO strings in local (America/New_York) wall time.
    throw new Error(NOT_IMPLEMENTED);
  }

  async getEvent(_slug: string): Promise<ChamberEvent | null> {
    // TODO: implement like getMember.
    throw new Error(NOT_IMPLEMENTED);
  }

  async getJobs(): Promise<Job[]> {
    // TODO: const raw = await amsFetch("/api/jobposting");
    throw new Error(NOT_IMPLEMENTED);
  }

  async getJob(_slug: string): Promise<Job | null> {
    // TODO: implement like getMember.
    throw new Error(NOT_IMPLEMENTED);
  }

  async getNews(): Promise<NewsPost[]> {
    // TODO: point at the AMS news resource, or swap in a CMS/RSS feed here —
    // the interface doesn't care where posts come from.
    throw new Error(NOT_IMPLEMENTED);
  }

  async getNewsPost(_slug: string): Promise<NewsPost | null> {
    // TODO: implement like getMember.
    throw new Error(NOT_IMPLEMENTED);
  }
}
