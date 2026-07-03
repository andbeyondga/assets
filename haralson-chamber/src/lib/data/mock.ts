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

import categoriesJson from "@/data/categories.json";
import membersJson from "@/data/members.json";
import eventsJson from "@/data/events.json";
import jobsJson from "@/data/jobs.json";
import newsJson from "@/data/news.json";
import { getMemberOverrides, getPortalJobs } from "@/lib/portal/store";

const categories = categoriesJson as Category[];
const events = eventsJson as ChamberEvent[];
const news = newsJson as NewsPost[];

/** Seed members with any profile edits made through the member portal
 *  (demo write-back) merged on top. */
function currentMembers(): Member[] {
  const overrides = getMemberOverrides();
  return (membersJson as Member[]).map((m) =>
    overrides[m.slug] ? { ...m, ...overrides[m.slug] } : m,
  );
}

/** Seed jobs plus any postings created through the member portal. */
function currentJobs(): Job[] {
  return [...(jobsJson as Job[]), ...getPortalJobs()];
}

/** Case/diacritic-insensitive match of a query against a member's
 *  searchable text (name, tagline, tags, city). */
function memberMatches(member: Member, search: string): boolean {
  const haystack = [
    member.name,
    member.tagline,
    member.address.city,
    ...(member.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/**
 * Mock data source backed by the JSON seed files in src/data/.
 *
 * This is what makes the whole site run and demo with zero external
 * dependencies. Edit the JSON files to change site content — no code
 * changes needed. See the README for the shape of each file.
 */
export class MockDataSource implements ChamberDataSource {
  async getMembers(query?: MemberQuery): Promise<Member[]> {
    let result = currentMembers();
    if (query?.categorySlug) {
      result = result.filter((m) => m.categorySlug === query.categorySlug);
    }
    if (query?.featured !== undefined) {
      result = result.filter((m) => Boolean(m.featured) === query.featured);
    }
    if (query?.search) {
      result = result.filter((m) => memberMatches(m, query.search!));
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMember(slug: string): Promise<Member | null> {
    return currentMembers().find((m) => m.slug === slug) ?? null;
  }

  async getCategories(): Promise<Category[]> {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getEvents(query?: EventQuery): Promise<ChamberEvent[]> {
    let result = events;
    if (query?.category) {
      result = result.filter((e) => e.category === query.category);
    }
    if (query?.from) {
      result = result.filter((e) => e.start >= query.from!);
    }
    if (query?.to) {
      result = result.filter((e) => e.start <= query.to!);
    }
    return [...result].sort((a, b) => a.start.localeCompare(b.start));
  }

  async getEvent(slug: string): Promise<ChamberEvent | null> {
    return events.find((e) => e.slug === slug) ?? null;
  }

  async getJobs(): Promise<Job[]> {
    return [...currentJobs()].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  }

  async getJob(slug: string): Promise<Job | null> {
    return currentJobs().find((j) => j.slug === slug) ?? null;
  }

  async getNews(): Promise<NewsPost[]> {
    return [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  async getNewsPost(slug: string): Promise<NewsPost | null> {
    return news.find((n) => n.slug === slug) ?? null;
  }
}
