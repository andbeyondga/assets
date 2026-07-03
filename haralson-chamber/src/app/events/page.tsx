import type { Metadata } from "next";
import { getDataSource } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { EventsExplorer } from "@/components/EventsExplorer";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Events Calendar",
  description:
    "Chamber luncheons, ribbon cuttings, workshops, and community festivals across Haralson County — browse the list or the calendar.",
};

export default async function EventsPage() {
  const events = await getDataSource().getEvents();

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Get together with us"
        lede="Luncheons, ribbon cuttings, workshops, and the festivals that fill our downtowns. Most events are open to everyone — members, guests, and the curious."
      />

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <EventsExplorer events={events} />
      </div>

      <CtaBand
        title="Never miss a luncheon."
        body="Members get every event in their inbox two weeks ahead — plus member pricing at the door."
      />
    </>
  );
}
