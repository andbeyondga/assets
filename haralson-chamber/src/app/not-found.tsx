import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-700">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-pine-900">
        Well, this road doesn&apos;t go anywhere.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-ink-soft">
        The page you&apos;re after may have moved or never existed. The
        directory is a good place to get your bearings.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-pine-700 px-5 py-2.5 font-semibold text-white hover:bg-pine-800"
        >
          Back home
        </Link>
        <Link
          href="/directory"
          className="rounded-md border border-pine-300 px-5 py-2.5 font-semibold text-pine-800 hover:bg-pine-50"
        >
          Member directory
        </Link>
      </div>
    </div>
  );
}
