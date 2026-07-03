import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Greater Haralson Chamber of Commerce — visit the office, call, or send a note.",
};

export default function ContactPage() {
  const mapQuery = encodeURIComponent(
    `${site.name}, ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`,
  );

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Come by, call, or write"
        lede="We're a small office with a big open door. Whatever your question — membership, events, or just where to get lunch — we'll point you right."
      />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-xl border border-sand-200 bg-white p-6">
              <h2 className="font-display text-lg font-semibold text-pine-900">
                Chamber office
              </h2>
              <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
                {site.address.street}
                <br />
                {site.address.city}, {site.address.state} {site.address.zip}
              </address>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
              >
                Get directions
              </a>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="font-semibold text-ink">Phone:</dt>
                  <dd>
                    <a
                      href={`tel:${site.phone.replace(/\D/g, "")}`}
                      className="text-ink-soft hover:text-pine-800"
                    >
                      {site.phone}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-ink">Email:</dt>
                  <dd>
                    <a href={`mailto:${site.email}`} className="text-ink-soft hover:text-pine-800">
                      {site.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-ink">Hours:</dt>
                  <dd className="text-ink-soft">{site.officeHours}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl bg-pine-800 p-6 text-cream">
              <h2 className="font-display text-lg font-semibold">
                Member business questions?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-pine-100">
                For dues, invoices, or updating your member record, call the
                office — those are handled directly by chamber staff, not
                through this website.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-pine-900">
              Send us a note
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              This opens your email app with everything filled in — we answer
              within one business day.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
