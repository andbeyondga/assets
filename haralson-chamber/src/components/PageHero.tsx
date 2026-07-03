interface PageHeroProps {
  eyebrow?: string;
  title: string;
  lede?: string;
}

/** Standard page-top band: eyebrow, serif title, optional lede. */
export function PageHero({ eyebrow, title, lede }: PageHeroProps) {
  return (
    <div className="bg-pine-900 text-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-300">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">
          {title}
        </h1>
        {lede && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pine-100">
            {lede}
          </p>
        )}
      </div>
    </div>
  );
}
