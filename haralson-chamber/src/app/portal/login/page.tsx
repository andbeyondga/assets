import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/portal/auth";
import { PageHero } from "@/components/PageHero";
import { LoginForm } from "@/components/portal/LoginForm";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to the Greater Haralson Chamber member portal.",
  robots: { index: false },
};

const DEMO_ACCOUNTS = [
  { business: "The Mill Table (gold, dues open)", email: "hello@themilltable.com" },
  { business: "Sweetwater Bakery (standard, dues open)", email: "orders@sweetwaterbakery.com" },
  { business: "Haralson Insurance Agency (legacy, dues paid)", email: "quotes@haralsoninsurance.com" },
];

export default async function LoginPage() {
  if (await getSession()) redirect("/portal");

  return (
    <>
      <PageHero
        eyebrow="Member Portal"
        title="Member login"
        lede="Sign in to pay dues, update your directory listing, and post to the jobs board."
      />
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-pine-900">Sign in</h2>
            <div className="mt-4">
              <LoginForm />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-clay-300 bg-clay-50 p-6">
            <h2 className="font-display text-lg font-semibold text-clay-900">
              Demo accounts
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-clay-900/80">
              This portal runs on sample data — sign in as any member below.
              The password for every demo account is{" "}
              <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
                chamber-demo
              </span>
              .
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email} className="rounded-lg bg-white p-3">
                  <p className="font-semibold text-ink">{a.business}</p>
                  <p className="font-mono text-xs text-ink-soft">{a.email}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-clay-900/70">
              Any member with an email in the seed data has an account.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
