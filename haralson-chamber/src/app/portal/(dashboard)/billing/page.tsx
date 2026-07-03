import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/portal/auth";
import { getInvoicesForMember } from "@/lib/portal/store";
import { formatDateShort } from "@/lib/format";
import { Badge } from "@/components/Badge";

export const metadata: Metadata = {
  title: "Dues & Billing",
  robots: { index: false },
};

export default async function BillingPage() {
  const session = (await getSession())!;
  const invoices = getInvoicesForMember(session.member.slug);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-pine-900">
        Dues &amp; billing
      </h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Invoices for your membership. Open invoices can be paid right here —
        payments in this demo are simulated end to end.
      </p>

      <div className="mt-6 space-y-4">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sand-200 bg-white p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-semibold text-pine-900">
                  {inv.description}
                </p>
                <Badge tone={inv.status === "paid" ? "pine" : "clay"}>
                  {inv.status === "paid" ? "Paid" : "Open"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                Issued {formatDateShort(inv.issuedAt)} · due {formatDateShort(inv.dueAt)}
                {inv.paidAt && ` · paid ${formatDateShort(inv.paidAt)}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-display text-xl font-semibold text-ink">
                ${inv.amount.toLocaleString()}
              </p>
              <Link
                href={`/portal/billing/${inv.id}`}
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  inv.status === "open"
                    ? "bg-clay-600 text-white hover:bg-clay-700"
                    : "border border-pine-300 text-pine-800 hover:bg-pine-50"
                }`}
              >
                {inv.status === "open" ? "Pay now" : "View"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
