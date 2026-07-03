import Link from "next/link";
import type { Job } from "@/lib/data";
import { formatDateShort, jobTypeLabels } from "@/lib/format";
import { Badge } from "./Badge";

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="group relative rounded-xl border border-sand-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="pine">{jobTypeLabels[job.type]}</Badge>
        {job.pay && <span className="text-sm font-medium text-ink">{job.pay}</span>}
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-pine-900">
        <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
          {job.title}
        </Link>
      </h3>
      <p className="mt-0.5 text-sm text-ink-soft">
        {job.company} · {job.location}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink">{job.summary}</p>
      <p className="mt-3 text-xs text-ink-soft">Posted {formatDateShort(job.postedAt)}</p>
    </article>
  );
}
