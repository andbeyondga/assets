"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, site } from "@/config/site";

/** Sticky site header with desktop nav and a disclosure menu on mobile. */
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-sand-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
            onClick={() => setOpen(false)}
          >
            {/* Simple wordmark; swap for a logo image in /public when ready */}
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-pine-800 font-display text-lg font-semibold text-cream"
            >
              H
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold text-pine-900">
                Greater Haralson
              </span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Chamber of Commerce
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-pine-800 bg-pine-50"
                        : "text-ink-soft hover:text-pine-800 hover:bg-pine-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden lg:block shrink-0">
            <Link
              href="/membership"
              className="inline-block rounded-md bg-clay-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-clay-700"
            >
              Become a Member
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="lg:hidden rounded-md p-2 text-pine-800 hover:bg-pine-50"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              aria-hidden
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="lg:hidden border-t border-sand-200 bg-cream"
        >
          <ul className="px-4 py-3 space-y-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                    isActive(item.href)
                      ? "text-pine-800 bg-pine-50"
                      : "text-ink-soft hover:text-pine-800 hover:bg-pine-50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/membership"
                onClick={() => setOpen(false)}
                className="block rounded-md bg-clay-600 px-3 py-2.5 text-center text-base font-semibold text-white hover:bg-clay-700"
              >
                Become a Member
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <span className="sr-only">{site.shortName}</span>
    </header>
  );
}
