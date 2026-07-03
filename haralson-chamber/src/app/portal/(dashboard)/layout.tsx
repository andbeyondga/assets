import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/portal/auth";
import { LogoutButton } from "@/components/portal/LogoutButton";

const PORTAL_NAV = [
  { label: "Dashboard", href: "/portal" },
  { label: "Dues & Billing", href: "/portal/billing" },
  { label: "My Listing", href: "/portal/profile" },
  { label: "Post a Job", href: "/portal/jobs" },
];

/** Auth gate + shell for every portal page (login lives outside this group). */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/portal/login");

  return (
    <div>
      <div className="bg-clay-100 px-4 py-2 text-center text-xs font-medium text-clay-900">
        Demo mode — payments are simulated and nothing leaves this machine.
      </div>
      <div className="border-b border-sand-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-clay-700">
              Member Portal
            </p>
            <p className="font-display text-xl font-semibold text-pine-900">
              {session.member.name}
            </p>
          </div>
          <LogoutButton />
        </div>
        <nav aria-label="Portal" className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="flex flex-wrap gap-1 pb-3">
            {PORTAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-pine-50 hover:text-pine-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
