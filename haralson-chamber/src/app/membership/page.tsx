import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Become a Member",
  description:
    "Join 700+ businesses in the Greater Haralson Chamber of Commerce. Directory listing, events, referrals, and a ribbon cutting — membership starts with a conversation.",
};

const BENEFITS = [
  {
    title: "Be found",
    body: "A listing in the member directory — where locals go first when they want to hire or buy from a neighbor — plus a spotlight opportunity in chamber news.",
  },
  {
    title: "Be connected",
    body: "Monthly luncheons, quarterly Business After Hours, and committees where the county's business owners actually meet each other.",
  },
  {
    title: "Be celebrated",
    body: "Every new member gets a ribbon cutting with the big scissors, photos, and a feature across the chamber's social channels.",
  },
  {
    title: "Be represented",
    body: "One voice to local and state government on the issues that touch your bottom line — roads, broadband, workforce, and taxes.",
  },
  {
    title: "Grow your team",
    body: "Free postings on the local jobs board, plus workforce pipelines with the college and career academy.",
  },
  {
    title: "Save money",
    body: "Member pricing at every event, member-to-member discounts, and free workshops that would cost real money anywhere else.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Say hello",
    body: `Call ${site.phone} or email ${site.email} — or just come by the office. Tell us about your business.`,
  },
  {
    step: "2",
    title: "Pick your level",
    body: "Investment is based on business size, starting at a few hundred dollars a year. We'll match you to the right level — no upselling, promise.",
  },
  {
    step: "3",
    title: "Get the big scissors",
    body: "We'll build your directory listing, introduce you at the next luncheon, and schedule your ribbon cutting.",
  },
];

export default function MembershipPage() {
  return (
    <>
      <PageHero
        eyebrow="Become a Member"
        title="Join the 700+ businesses growing together"
        lede="Chamber membership is the best-kept non-secret in Haralson County business: be found, be connected, and have the county pulling for you."
      />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <section aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="font-display text-2xl font-semibold text-pine-900">
            What members get
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-xl border border-sand-200 bg-white p-5">
                <h3 className="font-display text-lg font-semibold text-pine-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="join-heading" className="mt-14">
          <h2 id="join-heading" className="font-display text-2xl font-semibold text-pine-900">
            How joining works
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-xl bg-pine-800 p-6 text-cream">
                <p className="font-display text-4xl font-semibold text-clay-300">{s.step}</p>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-pine-100">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Dues, invoicing, and renewals are handled directly by the chamber
            office — give us a call and we&apos;ll take care of everything from
            there.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${site.phone.replace(/\D/g, "")}`}
              className="rounded-md bg-clay-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-clay-700"
            >
              Call {site.phone}
            </a>
            <Link
              href="/contact"
              className="rounded-md border border-pine-300 px-6 py-3 font-semibold text-pine-800 transition-colors hover:bg-pine-50"
            >
              Send us a note
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
