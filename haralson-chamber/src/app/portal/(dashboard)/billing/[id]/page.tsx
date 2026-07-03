import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/portal/auth";
import { getInvoice, getPayment } from "@/lib/portal/store";
import { formatDateShort } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { PaymentForm } from "@/components/portal/PaymentForm";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const session = (await getSession())!;
  const invoice = getInvoice(id);
  if (!invoice || invoice.memberSlug !== session.member.slug) notFound();

  const payment = invoice.paymentId ? getPayment(invoice.paymentId) : null;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link href="/portal/billing" className="hover:text-pine-800 hover:underline">
          Dues &amp; billing
        </Link>
        {" / "}
        <span aria-current="page" className="text-ink">
          {invoice.description}
        </span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold text-pine-900">
              Invoice
            </h1>
            <Badge tone={invoice.status === "paid" ? "pine" : "clay"}>
              {invoice.status === "paid" ? "Paid" : "Open"}
            </Badge>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Invoice #</dt>
              <dd className="font-mono text-xs">{invoice.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Billed to</dt>
              <dd className="font-semibold">{session.member.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Description</dt>
              <dd>{invoice.description}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Issued</dt>
              <dd>{formatDateShort(invoice.issuedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Due</dt>
              <dd>{formatDateShort(invoice.dueAt)}</dd>
            </div>
            <div className="flex justify-between border-t border-sand-200 pt-3">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-display text-xl font-semibold text-ink">
                ${invoice.amount.toLocaleString()}
              </dd>
            </div>
          </dl>
          {invoice.status === "paid" && (
            <p className="mt-4 rounded-md bg-pine-50 px-3 py-2 text-sm text-pine-800">
              Paid {invoice.paidAt && formatDateShort(invoice.paidAt)}
              {payment && (
                <>
                  {" "}
                  with card ending {payment.last4} · confirmation{" "}
                  <span className="font-mono text-xs">{payment.id}</span>
                </>
              )}
            </p>
          )}
        </div>

        {invoice.status === "open" && (
          <div className="rounded-xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-pine-900">
              Pay this invoice
            </h2>
            <div className="mt-4">
              <PaymentForm invoiceId={invoice.id} amount={invoice.amount} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
