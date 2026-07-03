import Link from "next/link";
import type { NewsPost } from "@/lib/data";
import { formatDateShort, newsTypeLabels } from "@/lib/format";
import { Badge } from "./Badge";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition-shadow hover:shadow-md">
      <PhotoPlaceholder label={post.title} className="h-36 w-full" showInitials={false} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge tone={post.type === "spotlight" ? "clay" : "pine"}>
            {newsTypeLabels[post.type]}
          </Badge>
          <span className="text-xs text-ink-soft">{formatDateShort(post.publishedAt)}</span>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-pine-900">
          <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink">{post.excerpt}</p>
      </div>
    </article>
  );
}
