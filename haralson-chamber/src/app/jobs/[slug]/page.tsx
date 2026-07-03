import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataSource } from "@/lib/data";
import { formatDate, jobTypeLabels, paragraphs } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { JobCard } from "@/components/JobCard";

/** Revalidate so portal write-back (profile edits, new job postings)
 *  shows up on the public site in production, not just dev. */
export const revalidate = 15;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const jobs = await getDataSource().getJobs();
  return jobs.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getDataSource().getJob(slug);
  if (!job) return {};
  return {
    title: `${job.title} at ${job.company}`,
    description: job.summary,
  };
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const data = getDataSource();
  const job = await data.getJob(slug);
  if (!job) notFound();

  const [member, allJobs] = await Promise.all([
    job.memberSlug ? data.getMember(job.memberSlug) : Promise.resolve(null),
    data.getJobs(),
  ]);
  const others = allJobs.filter((j) => j.slug !== job.slug).slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-soft">
        <Link href="/jobs" className="hover:text-pine-800 hover:underline">
          Jobs
        </Link>
        {" / "}
        <span aria-current="page" className="text-ink">
          {job.title}
        </span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{jobTypeLabels[job.type]}</Badge>
            {job.pay && <span className="text-sm font-medium text-ink">{job.pay}</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-pine-900 sm:text-4xl">
            {job.title}
          </h1>
          <p className="mt-2 text-lg text-ink-soft">
            {member ? (
              <Link
                href={`/directory/${member.slug}`}
                className="font-medium text-clay-700 underline-offset-4 hover:underline"
              >
                {job.company}
              </Link>
            ) : (
              job.company
            )}{" "}
            · {job.location}
          </p>

          <div className="mt-6 space-y-4 leading-relaxed text-ink">
            {paragraphs(job.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            Posted {formatDate(job.postedAt)}
          </p>
        </div>

        <aside className="h-fit rounded-xl border border-sand-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-pine-900">
            How to apply
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Apply directly with {job.company} — the chamber lists openings but
            doesn&apos;t handle applications.
          </p>
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-md bg-clay-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-clay-700"
            >
              Apply online
            </a>
          )}
          {job.applyEmail && (
            <a
              href={`mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
              className="mt-3 block rounded-md border border-pine-300 px-4 py-2.5 text-center text-sm font-semibold text-pine-800 transition-colors hover:bg-pine-50"
            >
              Email your application
            </a>
          )}
          {member && (
            <Link
              href={`/directory/${member.slug}`}
              className="mt-4 block text-center text-sm font-medium text-clay-700 underline-offset-4 hover:underline"
            >
              About {member.name} →
            </Link>
          )}
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-pine-900">
            Other openings
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {others.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
