import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getDataSource } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { CtaBand } from "@/components/CtaBand";

/** Revalidate so portal write-back (profile edits, new job postings)
 *  shows up on the public site in production, not just dev. */
export const revalidate = 15;

export const metadata: Metadata = {
  title: "Member Directory",
  description:
    "Search 700+ chamber member businesses across Bremen, Buchanan, Tallapoosa, and Waco — by name, category, or city.",
};

export default async function DirectoryPage() {
  const data = getDataSource();
  const [members, categories] = await Promise.all([
    data.getMembers(),
    data.getCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Member Directory"
        title="Find a local business"
        lede="Every listing is a chamber member — a neighbor who has invested in this county. Search by name, filter by category or city, and keep your dollars close to home."
      />

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        {/* Explorer reads ?q= and ?category= from the URL, so it sits in
            Suspense to keep this page statically generated. */}
        <Suspense>
          <DirectoryExplorer members={members} categories={categories} />
        </Suspense>

        <nav aria-label="Browse by category" className="mt-12">
          <h2 className="font-display text-xl font-semibold text-pine-900">
            Or browse by category
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/directory/category/${c.slug}`}
                  className="inline-block rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-pine-800 transition-colors hover:border-pine-400 hover:bg-pine-50"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <CtaBand
        title="Don't see your business?"
        body="A directory listing is one of the first benefits of membership — most members say it's how new customers find them."
      />
    </>
  );
}
