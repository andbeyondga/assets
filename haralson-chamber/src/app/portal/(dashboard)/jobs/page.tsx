import type { Metadata } from "next";
import Link from "next/link";
import { getDataSource } from "@/lib/data";
import { getSession } from "@/lib/portal/auth";
import { formatDateShort } from "@/lib/format";
import { JobPostForm } from "@/components/portal/JobPostForm";

export const metadata: Metadata = {
  title: "Post a Job",
  robots: { index: false },
};

export default async function PortalJobsPage() {
  const session = (await getSession())!;
  const allJobs = await getDataSource().getJobs();
  const myJobs = allJobs.filter((j) => j.memberSlug === session.member.slug);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-pine-900">
        Post a job
      </h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Postings go live on the{" "}
        <Link href="/jobs" className="font-semibold text-clay-700 underline-offset-4 hover:underline">
          public jobs board
        </Link>{" "}
        under {session.member.name} as soon as you submit.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <JobPostForm />
        </div>

        <aside className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-pine-900">
            Your current postings
          </h2>
          {myJobs.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {myJobs.map((j) => (
                <li key={j.id} className="rounded-lg border border-sand-100 p-3">
                  <Link
                    href={`/jobs/${j.slug}`}
                    className="font-semibold text-pine-800 underline-offset-4 hover:underline"
                  >
                    {j.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Posted {formatDateShort(j.postedAt)} · {j.location}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              Nothing posted yet — your openings will show here.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
