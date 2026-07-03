"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentRecord } from "@/lib/portal/types";

interface PaymentFormProps {
  invoiceId: string;
  amount: number;
}

/** SIMULATED checkout — success card 4242 4242 4242 4242, decline …0002. */
export function PaymentForm({ invoiceId, amount }: PaymentFormProps) {
  const router = useRouter();
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/portal/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, nameOnCard, cardNumber, expiry, cvc }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      payment?: PaymentRecord;
    };
    if (res.ok && data.payment) {
      setReceipt(data.payment);
      router.refresh();
    } else {
      setError(data.error ?? "Payment failed. Try again.");
    }
    setBusy(false);
  };

  if (receipt) {
    return (
      <div className="rounded-xl bg-pine-50 p-5" role="status">
        <p className="font-display text-lg font-semibold text-pine-900">
          Payment received — thank you!
        </p>
        <dl className="mt-3 space-y-1 text-sm text-ink">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Amount</dt>
            <dd className="font-semibold">${receipt.amount.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Card</dt>
            <dd>•••• {receipt.last4}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Confirmation</dt>
            <dd className="font-mono text-xs">{receipt.id}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-soft">
          Simulated payment — no card was actually charged.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-clay-50 px-3 py-2 text-sm text-clay-800">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="pay-name" className="block text-sm font-semibold text-ink">
          Name on card
        </label>
        <input
          id="pay-name"
          type="text"
          required
          autoComplete="cc-name"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="pay-card" className="block text-sm font-semibold text-ink">
          Card number
        </label>
        <input
          id="pay-card"
          type="text"
          inputMode="numeric"
          required
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pay-expiry" className="block text-sm font-semibold text-ink">
            Expiry (MM/YY)
          </label>
          <input
            id="pay-expiry"
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-exp"
            placeholder="12/28"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="pay-cvc" className="block text-sm font-semibold text-ink">
            CVC
          </label>
          <input
            id="pay-cvc"
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-csc"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-clay-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-60"
      >
        {busy ? "Processing…" : `Pay $${amount.toLocaleString()}`}
      </button>
      <p className="text-xs text-ink-soft">
        Demo checkout: <span className="font-mono">4242 4242 4242 4242</span> succeeds,
        any card ending <span className="font-mono">0002</span> is declined. No real
        charges are made.
      </p>
    </form>
  );
}
