import type { Metadata } from "next";
import { getDataSource } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { NewsCard } from "@/components/NewsCard";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "News & Member Spotlights",
  description:
    "Chamber announcements and stories about the member businesses that make Haralson County work.",
};

export default async function NewsPage() {
  const posts = await getDataSource().getNews();

  return (
    <>
      <PageHero
        eyebrow="News & Spotlights"
        title="Stories from around the county"
        lede="Chamber announcements, community wins, and spotlights on the people behind our member businesses."
      />

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {posts.map((p) => (
            <NewsCard key={p.id} post={p} />
          ))}
        </div>
      </div>

      <CtaBand
        title="Have a story worth telling?"
        body="Member spotlights are written by chamber staff and free to members — a new hire, an anniversary, an expansion. Tell us what's happening."
        buttonLabel="Contact the Chamber"
        buttonHref="/contact"
      />
    </>
  );
}
