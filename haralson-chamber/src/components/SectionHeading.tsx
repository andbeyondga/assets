import Link from "next/link";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** Optional "See all" style link shown to the right. */
  link?: { label: string; href: string };
}

export function SectionHeading({ eyebrow, title, link }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 font-display text-2xl font-semibold text-pine-900 sm:text-3xl">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
