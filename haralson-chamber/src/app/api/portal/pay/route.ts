import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/portal/auth";
import { getInvoice, recordPayment } from "@/lib/portal/store";

/**
 * SIMULATED payment processing — no real gateway, no real charges.
 * Rules (mirroring common gateway test cards):
 *   - Card number must pass a Luhn check
 *   - A card ending in 0002 is declined (e.g. 4000 0000 0000 0002)
 *   - 4242 4242 4242 4242 always succeeds
 * A live deployment replaces this handler's core with a call to the real
 * payment gateway / AMS billing API.
 */
export async function POST(req: NextRequest) {
  const memberSlug = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!memberSlug) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    invoiceId?: string;
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    nameOnCard?: string;
  } | null;

  if (!body?.invoiceId || !body.cardNumber || !body.expiry || !body.cvc || !body.nameOnCard) {
    return NextResponse.json({ error: "All payment fields are required." }, { status: 400 });
  }

  const invoice = getInvoice(body.invoiceId);
  if (!invoice || invoice.memberSlug !== memberSlug) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.status === "paid") {
    return NextResponse.json({ error: "This invoice is already paid." }, { status: 409 });
  }

  const digits = body.cardNumber.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnValid(digits)) {
    return NextResponse.json(
      { error: "That card number doesn't look right. Try the demo card 4242 4242 4242 4242." },
      { status: 422 },
    );
  }
  if (!/^\d{2}\s*\/\s*\d{2,4}$/.test(body.expiry.trim())) {
    return NextResponse.json({ error: "Expiry must look like MM/YY." }, { status: 422 });
  }
  if (!/^\d{3,4}$/.test(body.cvc.trim())) {
    return NextResponse.json({ error: "CVC must be 3 or 4 digits." }, { status: 422 });
  }
  if (digits.endsWith("0002")) {
    return NextResponse.json(
      { error: "Card declined (demo decline card). Use 4242 4242 4242 4242 to simulate success." },
      { status: 402 },
    );
  }

  const payment = recordPayment(invoice.id, digits.slice(-4));
  return NextResponse.json({ ok: true, payment });
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
