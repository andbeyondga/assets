import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/portal/auth";
import { getInvoicesForMember, getPaymentsForMember } from "@/lib/portal/store";
import { formatDateShort, memberTierLabels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Member Dashboard",
  robots: { index: false },
};

export default async function PortalDashboard() {
  const session = (await getSession())!; // layout guarantees a session
  const { member } = session;
  const invoices = getInvoicesForMember(member.slug);
  const payments = getPaymentsForMember(member.slug);
  const openInvoice = invoices.find((i) => i.status === "open");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-pine-900">
        Welcome back
      </h1>
      <p className="mt-2 text-ink-soft">
        Manage your membership, listing, and job postings — changes show up on
        the public site right away.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-sand-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
            Membership
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-pine-900">
            {memberTierLabels[member.tier]}
          </p>
          <p className="mt-1 text-sm text-ink-soft">Member since {member.memberSince}</p>
          <Link
            href={`/directory/${member.slug}`}
            className="mt-3 inline-block text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
          >
            View your public listing →
          </Link>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            openInvoice
              ? "border-clay-300 bg-clay-50"
              : "border-sand-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
            Dues
          </p>
          {openInvoice ? (
            <>
              <p className="mt-2 font-display text-xl font-semibold text-clay-800">
                ${openInvoice.amount.toLocaleString()} due
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {openInvoice.description} · due {formatDateShort(openInvoice.dueAt)}
              </p>
              <Link
                href={`/portal/billing/${openInvoice.id}`}
                className="mt-3 inline-block rounded-md bg-clay-600 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-700"
              >
                Pay now
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-xl font-semibold text-pine-800">
                Paid up — thank you!
              </p>
              <Link
                href="/portal/billing"
                className="mt-3 inline-block text-sm font-semibold text-clay-700 underline-offset-4 hover:underline"
              >
                Billing history →
              </Link>
            </>
          )}
        </div>

        <div className="rounded-xl border border-sand-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
            Quick actions
          </p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li>
              <Link href="/portal/profile" className="text-pine-700 underline-offset-4 hover:underline">
                Update your listing
              </Link>
            </li>
            <li>
              <Link href="/portal/jobs" className="text-pine-700 underline-offset-4 hover:underline">
                Post a job opening
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-pine-700 underline-offset-4 hover:underline">
                See upcoming events
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {payments.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-pine-900">
            Recent payments
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-sand-200 bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-sand-200 bg-sand-50 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Card</th>
                  <th className="px-4 py-2.5 font-semibold">Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b border-sand-100 last:border-0">
                    <td className="px-4 py-2.5">{formatDateShort(p.paidAt)}</td>
                    <td className="px-4 py-2.5 font-semibold">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">•••• {p.last4}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
