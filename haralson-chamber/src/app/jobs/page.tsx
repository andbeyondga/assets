import type { Metadata } from "next";
import { getDataSource } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { JobCard } from "@/components/JobCard";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Local Jobs",
  description:
    "Job openings at chamber member businesses across Bremen, Buchanan, Tallapoosa, and Waco — work close to home.",
};

export default async function JobsPage() {
  const jobs = await getDataSource().getJobs();

  return (
    <>
      <PageHero
        eyebrow="Jobs Board"
        title="Work close to home"
        lede="Openings at chamber member businesses across Haralson County. Every employer here is a neighbor — apply directly using the contact on each posting."
      />

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <p className="text-sm text-ink-soft">
          {jobs.length} open position{jobs.length === 1 ? "" : "s"}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      </div>

      <CtaBand
        title="Hiring?"
        body="Job postings on this board are free for chamber members. Send your posting to the chamber office and we'll have it up within two business days."
        buttonLabel="Contact the Chamber"
        buttonHref="/contact"
      />
    </>
  );
}
