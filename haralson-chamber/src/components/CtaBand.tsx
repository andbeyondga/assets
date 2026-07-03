import Link from "next/link";

interface CtaBandProps {
  title?: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

/** Warm call-to-action band used at the bottom of most pages. */
export function CtaBand({
  title = "Your business belongs here.",
  body = "Join 700+ businesses across Bremen, Buchanan, Tallapoosa, and Waco who grow together through the chamber.",
  buttonLabel = "Become a Member",
  buttonHref = "/membership",
}: CtaBandProps) {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
      <div className="rounded-2xl bg-pine-800 px-6 py-10 text-center sm:px-12 sm:py-12">
        <h2 className="font-display text-3xl font-semibold text-cream">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-pine-100">{body}</p>
        <Link
          href={buttonHref}
          className="mt-6 inline-block rounded-md bg-clay-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-clay-600"
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
