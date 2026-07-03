import type { MetadataRoute } from "next";
import { getDataSource } from "@/lib/data";
import { site } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = getDataSource();
  const [members, categories, events, jobs, news] = await Promise.all([
    data.getMembers(),
    data.getCategories(),
    data.getEvents(),
    data.getJobs(),
    data.getNews(),
  ]);

  const staticPaths = [
    "",
    "/about",
    "/board-staff",
    "/membership",
    "/programs",
    "/ribbon-cuttings",
    "/contact",
    "/directory",
    "/events",
    "/jobs",
    "/news",
  ];

  return [
    ...staticPaths.map((p) => ({ url: `${site.url}${p}` })),
    ...categories.map((c) => ({ url: `${site.url}/directory/category/${c.slug}` })),
    ...members.map((m) => ({ url: `${site.url}/directory/${m.slug}` })),
    ...events.map((e) => ({ url: `${site.url}/events/${e.slug}` })),
    ...jobs.map((j) => ({ url: `${site.url}/jobs/${j.slug}` })),
    ...news.map((n) => ({ url: `${site.url}/news/${n.slug}` })),
  ];
}
