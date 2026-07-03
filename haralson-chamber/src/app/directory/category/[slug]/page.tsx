import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataSource } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { MemberCard } from "@/components/MemberCard";

/** Revalidate so portal write-back (profile edits, new job postings)
 *  shows up on the public site in production, not just dev. */
export const revalidate = 15;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getDataSource().getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getDataSource().getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name} — Member Directory`,
    description: `${category.description} Chamber member businesses in Haralson County, Georgia.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = getDataSource();
  const categories = await data.getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const members = await data.getMembers({ categorySlug: slug });

  return (
    <>
      <PageHero eyebrow="Member Directory" title={category.name} lede={category.description} />

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <p className="text-sm text-ink-soft">
          {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
          <Link href="/directory" className="font-semibold text-clay-700 underline-offset-4 hover:underline">
            Search the full directory
          </Link>
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>

        <nav aria-label="Other categories" className="mt-12">
          <h2 className="font-display text-xl font-semibold text-pine-900">
            More categories
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories
              .filter((c) => c.slug !== slug)
              .map((c) => (
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
    </>
  );
}
