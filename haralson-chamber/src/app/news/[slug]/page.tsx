import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataSource } from "@/lib/data";
import { formatDate, newsTypeLabels, paragraphs } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { NewsCard } from "@/components/NewsCard";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getDataSource().getNews();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getDataSource().getNewsPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", publishedTime: post.publishedAt },
  };
}

export default async function NewsPostPage({ params }: Props) {
  const { slug } = await params;
  const data = getDataSource();
  const post = await data.getNewsPost(slug);
  if (!post) notFound();

  const [member, allPosts] = await Promise.all([
    post.memberSlug ? data.getMember(post.memberSlug) : Promise.resolve(null),
    data.getNews(),
  ]);
  const more = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-soft">
        <Link href="/news" className="hover:text-pine-800 hover:underline">
          News
        </Link>
        {" / "}
        <span aria-current="page" className="text-ink">
          {post.title}
        </span>
      </nav>

      <article className="mx-auto mt-6 max-w-3xl">
        <Badge tone={post.type === "spotlight" ? "clay" : "pine"}>
          {newsTypeLabels[post.type]}
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-pine-900 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          By {post.author} · {formatDate(post.publishedAt)}
        </p>

        <PhotoPlaceholder
          label={post.title}
          showInitials={false}
          className="mt-6 h-56 w-full rounded-xl sm:h-72"
        />

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink">
          {paragraphs(post.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {member && (
          <aside className="mt-10 rounded-xl border border-sand-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-clay-700">
              Featured in this story
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-pine-900">
              {member.name}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{member.tagline}</p>
            <Link
              href={`/directory/${member.slug}`}
              className="mt-3 inline-block text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
            >
              View their directory listing →
            </Link>
          </aside>
        )}
      </article>

      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-pine-900">
            More stories
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {more.map((p) => (
              <NewsCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
