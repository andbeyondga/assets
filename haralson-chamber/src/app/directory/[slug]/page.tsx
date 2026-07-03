import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataSource } from "@/lib/data";
import { memberTierLabels, paragraphs } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { MemberCard } from "@/components/MemberCard";

/** Revalidate so portal write-back (profile edits, new job postings)
 *  shows up on the public site in production, not just dev. */
export const revalidate = 15;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const members = await getDataSource().getMembers();
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await getDataSource().getMember(slug);
  if (!member) return {};
  return {
    title: `${member.name} — ${member.address.city}, GA`,
    description: member.tagline,
  };
}

export default async function MemberPage({ params }: Props) {
  const { slug } = await params;
  const data = getDataSource();
  const member = await data.getMember(slug);
  if (!member) notFound();

  const [categories, related] = await Promise.all([
    data.getCategories(),
    data.getMembers({ categorySlug: member.categorySlug }),
  ]);
  const category = categories.find((c) => c.slug === member.categorySlug);
  const neighbors = related.filter((m) => m.slug !== member.slug).slice(0, 2);

  const mapQuery = encodeURIComponent(
    `${member.name}, ${member.address.street}, ${member.address.city}, ${member.address.state} ${member.address.zip}`,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-soft">
        <Link href="/directory" className="hover:text-pine-800 hover:underline">
          Directory
        </Link>
        {category && (
          <>
            {" / "}
            <Link
              href={`/directory/category/${category.slug}`}
              className="hover:text-pine-800 hover:underline"
            >
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span aria-current="page" className="text-ink">
          {member.name}
        </span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex items-start gap-5">
            <PhotoPlaceholder label={member.name} className="h-20 w-20 shrink-0 rounded-xl" />
            <div>
              <h1 className="font-display text-3xl font-semibold text-pine-900 sm:text-4xl">
                {member.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {category && <Badge>{category.name}</Badge>}
                <Badge tone={member.tier === "gold" ? "gold" : member.tier === "legacy" ? "clay" : "sand"}>
                  {memberTierLabels[member.tier]}
                </Badge>
                <span className="text-sm text-ink-soft">
                  Member since {member.memberSince}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-ink">{member.tagline}</p>

          <div className="mt-4 space-y-4 leading-relaxed text-ink">
            {paragraphs(member.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {member.tags && member.tags.length > 0 && (
            <ul aria-label="Keywords" className="mt-6 flex flex-wrap gap-2">
              {member.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-sand-900"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-sand-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-pine-900">
            Visit or get in touch
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-ink">Address</dt>
              <dd className="mt-0.5 text-ink-soft">
                {member.address.street}
                <br />
                {member.address.city}, {member.address.state} {member.address.zip}
                <br />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-clay-700 underline-offset-4 hover:underline"
                >
                  Get directions
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd className="mt-0.5">
                <a href={`tel:${member.phone.replace(/\D/g, "")}`} className="text-ink-soft hover:text-pine-800">
                  {member.phone}
                </a>
              </dd>
            </div>
            {member.email && (
              <div>
                <dt className="font-semibold text-ink">Email</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${member.email}`} className="break-all text-ink-soft hover:text-pine-800">
                    {member.email}
                  </a>
                </dd>
              </div>
            )}
            {member.hours && (
              <div>
                <dt className="font-semibold text-ink">Hours</dt>
                <dd className="mt-0.5 text-ink-soft">{member.hours}</dd>
              </div>
            )}
          </dl>
          {member.website && (
            <a
              href={member.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block rounded-md bg-pine-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-pine-800"
            >
              Visit website
            </a>
          )}
        </aside>
      </div>

      {neighbors.length > 0 && category && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-pine-900">
            More in {category.name}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {neighbors.map((m) => (
              <MemberCard key={m.id} member={m} category={category} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
