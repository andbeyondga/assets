"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Member } from "@/lib/data";
import { MemberCard } from "./MemberCard";

const CITIES = ["Bremen", "Buchanan", "Tallapoosa", "Waco"] as const;

interface DirectoryExplorerProps {
  members: Member[];
  categories: Category[];
}

/**
 * Client-side search and filter over the full member list.
 * The list is small enough (hundreds) that shipping it and filtering in the
 * browser is instant; when the directory outgrows this, push the filtering
 * into the data source (MemberQuery already supports it).
 */
export function DirectoryExplorer({ members, categories }: DirectoryExplorerProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [categorySlug, setCategorySlug] = useState(
    searchParams.get("category") ?? "",
  );
  const [city, setCity] = useState("");

  const categoryBySlug = useMemo(
    () => new Map(categories.map((c) => [c.slug, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return members.filter((m) => {
      if (categorySlug && m.categorySlug !== categorySlug) return false;
      if (city && m.address.city !== city) return false;
      if (terms.length > 0) {
        const haystack = [
          m.name,
          m.tagline,
          m.address.city,
          categoryBySlug.get(m.categorySlug)?.name ?? "",
          ...(m.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      return true;
    });
  }, [members, query, categorySlug, city, categoryBySlug]);

  return (
    <div>
      <div className="rounded-xl border border-sand-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label htmlFor="directory-search" className="sr-only">
              Search members
            </label>
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, keyword, or city…"
              className="w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm placeholder:text-ink-soft/70 focus:border-pine-500"
            />
          </div>
          <div>
            <label htmlFor="directory-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="directory-category"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full rounded-md border border-sand-300 bg-cream px-3 py-2.5 text-sm sm:w-56"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="directory-city" className="sr-only">
              Filter by city
            </label>
            <select
              id="directory-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-sand-300 bg-cream px-3 py-2.5 text-sm sm:w-40"
            >
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-ink-soft" role="status" aria-live="polite">
        Showing {filtered.length} of {members.length} members
        {categorySlug && ` in ${categoryBySlug.get(categorySlug)?.name}`}
        {city && ` in ${city}`}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} category={categoryBySlug.get(m.categorySlug)} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-sand-300 bg-white p-10 text-center">
          <p className="font-display text-lg text-pine-900">No members match that search.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try fewer words, or clear a filter — the business you&apos;re looking for
            may list itself a little differently.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategorySlug("");
              setCity("");
            }}
            className="mt-4 rounded-md bg-pine-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-800"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
