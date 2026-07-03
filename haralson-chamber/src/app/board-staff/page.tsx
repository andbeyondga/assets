import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { board, staff } from "@/content/board";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Board & Staff",
  description:
    "Meet the volunteer board of directors and the staff of the Greater Haralson Chamber of Commerce.",
};

export default function BoardStaffPage() {
  return (
    <>
      <PageHero
        eyebrow="Board & Staff"
        title="The people pulling for the county"
        lede="A small staff and a volunteer board of local business owners — every one of them runs or works in a business you'll find in our directory."
      />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <section aria-labelledby="staff-heading">
          <h2 id="staff-heading" className="font-display text-2xl font-semibold text-pine-900">
            Chamber staff
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {staff.map((person) => (
              <div
                key={person.name}
                className="rounded-xl border border-sand-200 bg-white p-5"
              >
                <PhotoPlaceholder label={person.name} className="h-20 w-20 rounded-full" />
                <h3 className="mt-4 font-display text-lg font-semibold text-pine-900">
                  {person.name}
                </h3>
                <p className="text-sm font-medium text-clay-700">{person.role}</p>
                {person.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{person.bio}</p>
                )}
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="mt-3 inline-block text-sm font-medium text-pine-700 underline-offset-4 hover:underline"
                  >
                    {person.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="board-heading" className="mt-14">
          <h2 id="board-heading" className="font-display text-2xl font-semibold text-pine-900">
            Board of directors
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {board.map((person) => (
              <div
                key={person.name}
                className="flex items-center gap-4 rounded-xl border border-sand-200 bg-white p-4"
              >
                <PhotoPlaceholder
                  label={person.name}
                  className="h-14 w-14 shrink-0 rounded-full"
                />
                <div className="min-w-0">
                  <h3 className="font-display font-semibold leading-snug text-pine-900">
                    {person.name}
                  </h3>
                  <p className="text-sm text-clay-700">{person.role}</p>
                  {person.affiliation &&
                    (person.memberSlug ? (
                      <Link
                        href={`/directory/${person.memberSlug}`}
                        className="text-sm text-ink-soft underline-offset-4 hover:text-pine-800 hover:underline"
                      >
                        {person.affiliation}
                      </Link>
                    ) : (
                      <p className="text-sm text-ink-soft">{person.affiliation}</p>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CtaBand
        title="Want a seat at the table?"
        body="Board members are nominated from the membership each fall. The first step is the easiest one: join."
      />
    </>
  );
}
