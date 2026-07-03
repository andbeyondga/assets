import Link from "next/link";
import { getDataSource } from "@/lib/data";
import { site } from "@/config/site";
import { SectionHeading } from "@/components/SectionHeading";
import { MemberCard } from "@/components/MemberCard";
import { EventCard } from "@/components/EventCard";
import { NewsCard } from "@/components/NewsCard";
import { CtaBand } from "@/components/CtaBand";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

export default async function HomePage() {
  const data = getDataSource();
  const [featured, events, news, categories, allMembers] = await Promise.all([
    data.getMembers({ featured: true }),
    data.getEvents(),
    data.getNews(),
    data.getCategories(),
    data.getMembers(),
  ]);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const memberCountByCategory = new Map<string, number>();
  for (const m of allMembers) {
    memberCountByCategory.set(
      m.categorySlug,
      (memberCountByCategory.get(m.categorySlug) ?? 0) + 1,
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-pine-900 text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-300">
              Bremen · Buchanan · Tallapoosa · Waco
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Where west Georgia does business.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pine-100">
              For more than 700 member businesses across Haralson County, the
              chamber is the front porch of local commerce — a place to be
              found, make connections, and grow together.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/directory"
                className="rounded-md bg-clay-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-clay-600"
              >
                Find a Local Business
              </Link>
              <Link
                href="/membership"
                className="rounded-md border border-pine-400 px-6 py-3 font-semibold text-cream transition-colors hover:bg-pine-800"
              >
                Become a Member
              </Link>
            </div>
          </div>
          <PhotoPlaceholder
            label="Downtown Haralson County"
            showInitials={false}
            className="hidden h-72 rounded-2xl lg:block"
          />
        </div>
      </section>

      {/* Directory categories */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Member Directory"
          title="Shop and hire local, by category"
          link={{ label: "Browse the full directory", href: "/directory" }}
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/directory/category/${c.slug}`}
              className="group rounded-xl border border-sand-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-display font-semibold leading-snug text-pine-900 group-hover:text-clay-700">
                {c.name}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {memberCountByCategory.get(c.slug) ?? 0} members
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured members */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Featured Members"
          title="Neighbors doing good work"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {featured.slice(0, 6).map((m) => (
            <MemberCard key={m.id} member={m} category={categoryBySlug.get(m.categorySlug)} />
          ))}
        </div>
      </section>

      {/* Upcoming events */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Get Together"
          title="Upcoming events"
          link={{ label: "Full calendar", href: "/events" }}
        />
        <div className="mt-6 space-y-4">
          {events.slice(0, 3).map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* News */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Around the County"
          title="News & member spotlights"
          link={{ label: "All news", href: "/news" }}
        />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {news.slice(0, 3).map((p) => (
            <NewsCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      <CtaBand
        title="Your business belongs here."
        body={`Membership starts with a conversation. Call us at ${site.phone}, or read about what members get — from ribbon cuttings to referrals.`}
      />
    </>
  );
}
