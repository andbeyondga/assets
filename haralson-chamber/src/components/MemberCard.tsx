import Link from "next/link";
import type { Category, Member } from "@/lib/data";
import { Badge } from "./Badge";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

interface MemberCardProps {
  member: Member;
  /** Category to display on the card (looked up by the parent). */
  category?: Category;
}

export function MemberCard({ member, category }: MemberCardProps) {
  return (
    <article className="group relative flex gap-4 rounded-xl border border-sand-200 bg-white p-4 transition-shadow hover:shadow-md">
      <PhotoPlaceholder
        label={member.name}
        className="h-16 w-16 shrink-0 rounded-lg"
      />
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold leading-snug text-pine-900">
          <Link
            href={`/directory/${member.slug}`}
            className="after:absolute after:inset-0"
          >
            {member.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {member.address.city}, {member.address.state}
          {category ? ` · ${category.name}` : ""}
        </p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink">
          {member.tagline}
        </p>
        {(member.tier === "gold" || member.tier === "legacy") && (
          <div className="mt-2">
            <Badge tone={member.tier === "gold" ? "gold" : "clay"}>
              {member.tier === "gold" ? "Gold Member" : `Member since ${member.memberSince}`}
            </Badge>
          </div>
        )}
      </div>
    </article>
  );
}
