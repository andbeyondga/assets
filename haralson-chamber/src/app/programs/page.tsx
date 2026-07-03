import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Signature programs of the Greater Haralson Chamber — luncheons, Business After Hours, workshops, leadership development, and the annual golf classic.",
};

const PROGRAMS = [
  {
    title: "Monthly Membership Luncheons",
    when: "Third Thursday, monthly",
    body: "The county's business community around one set of tables. A speaker worth hearing, a lunch worth eating, and 60-second member introductions that have launched a hundred partnerships.",
    href: "/events",
    linkLabel: "See upcoming luncheons",
  },
  {
    title: "Business After Hours",
    when: "Quarterly, hosted by a member",
    body: "Casual evening networking hosted at a different member business each quarter. No agenda, no slides — just neighbors talking shop. Hosting is one of the best marketing moves a member can make.",
    href: "/events",
    linkLabel: "Find the next one",
  },
  {
    title: "Ribbon Cuttings & Groundbreakings",
    when: "Scheduled with each business",
    body: "Big scissors, real crowd, photos everywhere. We celebrate every new member, new location, and major expansion — and we bring the audience with us.",
    href: "/ribbon-cuttings",
    linkLabel: "See recent cuttings",
  },
  {
    title: "Small Business Workshops",
    when: "Monthly-ish, practical always",
    body: "Marketing, bookkeeping, hiring, succession — taught hands-on with partners like the UGA Small Business Development Center and West Georgia Technical College.",
    href: "/events",
    linkLabel: "Upcoming workshops",
  },
  {
    title: "Leadership Haralson",
    when: "Nine-month cohort, apply each summer",
    body: "The county's leadership pipeline. One day a month inside a different part of how Haralson County actually works — government, industry, agriculture, schools — with a class project that leaves something behind.",
    href: "/contact",
    linkLabel: "Ask about the next class",
  },
  {
    title: "Annual Golf Classic",
    when: "Every October",
    body: "Our biggest fundraiser, benefiting the Haralson Youth Sports Foundation. A four-person scramble, a barbecue lunch, and a $10,000 hole-in-one nobody has hit. Yet.",
    href: "/events",
    linkLabel: "Tournament details",
  },
];

export default function ProgramsPage() {
  return (
    <>
      <PageHero
        eyebrow="Programs"
        title="What we run, year in and year out"
        lede="The recurring programs that keep the county's business community connected, sharpened, and celebrated."
      />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {PROGRAMS.map((p) => (
            <div key={p.title} className="flex flex-col rounded-xl border border-sand-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-clay-700">
                {p.when}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-pine-900">
                {p.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              <Link
                href={p.href}
                className="mt-4 text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
              >
                {p.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <CtaBand
        title="Programs are member-powered."
        body="Every speaker slot, host venue, and sponsorship on this page is filled by a member business. Join and get in the rotation."
      />
    </>
  );
}
