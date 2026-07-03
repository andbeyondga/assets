import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

export const metadata: Metadata = {
  title: "About the Chamber",
  description:
    "The Greater Haralson Chamber of Commerce has connected the businesses of Bremen, Buchanan, Tallapoosa, and Waco for generations. Here's who we are and what we do.",
};

const STATS = [
  { value: "700+", label: "Member businesses" },
  { value: "4", label: "Hometowns served" },
  { value: "40+", label: "Events every year" },
  { value: "340", label: "Kids funded to play ball last year" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="The front porch of Haralson County business"
        lede="We're the place where a new business gets its first customers, a growing one finds its next hire, and neighbors figure out — together — what this county needs next."
      />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="space-y-5 leading-relaxed text-ink">
            <h2 className="font-display text-2xl font-semibold text-pine-900">
              What we believe
            </h2>
            <p>
              Haralson County works because its businesses do. From the square in
              Bremen to Head Avenue in Tallapoosa, from the courthouse square in
              Buchanan to Depot Street in Waco, this county runs on family-owned
              shops, farms, clinics, and crews — many in their second, third, or
              fourth generation.
            </p>
            <p>
              The Greater Haralson Chamber of Commerce exists to help those
              businesses find each other, find their customers, and speak with one
              voice when it matters. We are proudly pro-business and proudly
              community-first, because around here those are the same thing.
            </p>
            <h2 className="pt-2 font-display text-2xl font-semibold text-pine-900">
              What we actually do
            </h2>
            <p>
              We run the member directory people actually use to find local
              businesses. We put on the luncheons, after-hours mixers, and
              workshops where deals and friendships get made. We cut ribbons for
              every new member — big scissors, real crowd. We keep a jobs board so
              local talent can work close to home, and we tell members&apos;
              stories through spotlights and community news.
            </p>
            <p>
              When something affects business here — a bypass, a broadband
              project, a school partnership — we get the right people in the same
              room. That&apos;s been the job for generations, and we&apos;re not
              done.
            </p>
          </div>

          <div className="space-y-5">
            <PhotoPlaceholder
              label="Chamber Community"
              showInitials={false}
              className="h-56 rounded-2xl"
            />
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-sand-200 bg-white p-4 text-center"
                >
                  <p className="font-display text-3xl font-semibold text-clay-700">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-ink-soft">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-sand-200 bg-white p-5">
              <h2 className="font-display text-lg font-semibold text-pine-900">
                Meet the people
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                The chamber is led by a volunteer board of local business owners
                and a small staff who love this county.
              </p>
              <Link
                href="/board-staff"
                className="mt-3 inline-block text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
              >
                Board & Staff →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CtaBand />
    </>
  );
}
