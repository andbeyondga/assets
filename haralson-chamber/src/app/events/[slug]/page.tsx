import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataSource } from "@/lib/data";
import {
  eventCategoryLabels,
  formatDate,
  formatTimeRange,
  paragraphs,
} from "@/lib/format";
import { Badge } from "@/components/Badge";
import { EventCard } from "@/components/EventCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const events = await getDataSource().getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getDataSource().getEvent(slug);
  if (!event) return {};
  return {
    title: `${event.title} — ${formatDate(event.start)}`,
    description: event.summary,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const data = getDataSource();
  const event = await data.getEvent(slug);
  if (!event) notFound();

  const others = (await data.getEvents())
    .filter((e) => e.slug !== event.slug)
    .slice(0, 2);

  const mapQuery = event.address
    ? encodeURIComponent(
        `${event.venue}, ${event.address.street}, ${event.address.city}, ${event.address.state} ${event.address.zip}`,
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-soft">
        <Link href="/events" className="hover:text-pine-800 hover:underline">
          Events
        </Link>
        {" / "}
        <span aria-current="page" className="text-ink">
          {event.title}
        </span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <Badge tone={event.category === "ribbon-cutting" ? "clay" : "pine"}>
            {eventCategoryLabels[event.category]}
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-pine-900 sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            {formatDate(event.start)} · {formatTimeRange(event.start, event.end)}
          </p>

          <div className="mt-6 space-y-4 leading-relaxed text-ink">
            {paragraphs(event.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-sand-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-pine-900">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-ink">When</dt>
              <dd className="mt-0.5 text-ink-soft">
                {formatDate(event.start)}
                <br />
                {formatTimeRange(event.start, event.end)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Where</dt>
              <dd className="mt-0.5 text-ink-soft">
                {event.venue}
                {event.address && (
                  <>
                    <br />
                    {event.address.street}, {event.address.city},{" "}
                    {event.address.state} {event.address.zip}
                    <br />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-clay-700 underline-offset-4 hover:underline"
                    >
                      Get directions
                    </a>
                  </>
                )}
              </dd>
            </div>
            {event.cost && (
              <div>
                <dt className="font-semibold text-ink">Cost</dt>
                <dd className="mt-0.5 text-ink-soft">{event.cost}</dd>
              </div>
            )}
          </dl>
          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block rounded-md bg-clay-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-clay-700"
            >
              Register
            </a>
          )}
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-pine-900">
            More coming up
          </h2>
          <div className="mt-4 space-y-4">
            {others.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
