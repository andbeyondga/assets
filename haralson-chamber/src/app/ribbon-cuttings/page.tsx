import type { Metadata } from "next";
import Link from "next/link";
import { getDataSource } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { EventCard } from "@/components/EventCard";
import { CtaBand } from "@/components/CtaBand";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

export const metadata: Metadata = {
  title: "Ribbon Cuttings",
  description:
    "Big scissors, real crowds. How chamber ribbon cuttings work and which ones are coming up in Haralson County.",
};

export default async function RibbonCuttingsPage() {
  const cuttings = await getDataSource().getEvents({ category: "ribbon-cutting" });

  return (
    <>
      <PageHero
        eyebrow="Ribbon Cuttings"
        title="Big scissors. Real crowd."
        lede="Every new member, new location, and major expansion gets a proper celebration — and we bring the audience with us."
      />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="space-y-5 leading-relaxed text-ink">
            <h2 className="font-display text-2xl font-semibold text-pine-900">
              How it works
            </h2>
            <p>
              A ribbon cutting is the chamber&apos;s signature welcome. We
              schedule it with you, invite the membership, city officials, and
              the ambassadors club, and show up with the big scissors and the
              ribbon. You show off your business.
            </p>
            <p>
              Afterward, photos go out across the chamber&apos;s social channels
              and into the newsletter — for a lot of new businesses, it&apos;s
              the single biggest day of local exposure they&apos;ve had.
            </p>
            <p>
              Ribbon cuttings are free with membership and open to the public.
              Opening soon?{" "}
              <Link
                href="/contact"
                className="font-semibold text-clay-700 underline-offset-4 hover:underline"
              >
                Get on the calendar
              </Link>
              .
            </p>
          </div>
          <PhotoPlaceholder
            label="Ribbon Cutting"
            showInitials={false}
            className="h-56 rounded-2xl lg:h-64"
          />
        </div>

        <section className="mt-14" aria-labelledby="upcoming-cuttings">
          <h2 id="upcoming-cuttings" className="font-display text-2xl font-semibold text-pine-900">
            Upcoming ribbon cuttings
          </h2>
          {cuttings.length > 0 ? (
            <div className="mt-4 space-y-4">
              {cuttings.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-sand-300 bg-white p-8 text-center text-ink-soft">
              None on the calendar right now — check the{" "}
              <Link href="/events" className="font-semibold text-clay-700 underline-offset-4 hover:underline">
                events page
              </Link>{" "}
              for everything else coming up.
            </p>
          )}
        </section>
      </div>

      <CtaBand
        title="Opening a business?"
        body="Let's put it on the calendar. The scissors are ready."
        buttonLabel="Schedule Your Ribbon Cutting"
        buttonHref="/contact"
      />
    </>
  );
}
