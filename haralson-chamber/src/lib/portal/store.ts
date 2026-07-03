import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Job, Member, MemberTier } from "@/lib/data";
import type {
  Invoice,
  MemberProfileUpdate,
  PaymentRecord,
  PortalAccount,
  PortalStoreData,
} from "./types";
import membersJson from "@/data/members.json";

/* =============================================================================
 * PORTAL STORE (DEMO)
 * =============================================================================
 * A tiny file-backed "database" (.data/portal.json, gitignored) so the member
 * portal — login, dues, simulated payments, profile edits, job postings — can
 * be tested end to end with no external services.
 *
 * On first access it seeds itself: an account for every member that has an
 * email address (password "chamber-demo"), plus 2025 (paid) and 2026 dues
 * invoices per account. Delete .data/portal.json to reset the demo.
 *
 * GOING LIVE: replace the function bodies below with AMS calls —
 * authentication against the AMS's member login, invoices/payments through
 * its billing API, and profile/job writes through its update endpoints.
 * The route handlers and pages only use these functions, so the swap is
 * contained to this file.
 * ========================================================================== */

const members = membersJson as Member[];

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "portal.json");

const PASSWORD_SALT = "haralson-demo-salt";
export const DEMO_PASSWORD = "chamber-demo";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

const DUES_BY_TIER: Record<MemberTier, number> = {
  standard: 350,
  silver: 600,
  gold: 1200,
  legacy: 350,
};

function seed(): PortalStoreData {
  const withEmail = members.filter((m) => m.email);
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const accounts: PortalAccount[] = withEmail.map((m) => ({
    email: m.email!,
    passwordHash,
    memberSlug: m.slug,
    contactName: m.name,
  }));

  const invoices: Invoice[] = [];
  const payments: PaymentRecord[] = [];
  for (const m of withEmail) {
    const amount = DUES_BY_TIER[m.tier];

    // 2025 dues: everyone paid, with a matching payment record.
    const paidInvoiceId = `inv-2025-${m.slug}`;
    const paymentId = `pay-2025-${m.slug}`;
    invoices.push({
      id: paidInvoiceId,
      memberSlug: m.slug,
      description: "2025 Annual Membership Dues",
      amount,
      issuedAt: "2025-01-05",
      dueAt: "2025-02-15",
      status: "paid",
      paidAt: "2025-01-22",
      paymentId,
    });
    payments.push({
      id: paymentId,
      invoiceId: paidInvoiceId,
      memberSlug: m.slug,
      amount,
      last4: "4242",
      paidAt: "2025-01-22T10:15:00",
    });

    // 2026 dues: legacy members renewed early; everyone else has an open
    // invoice so the payment flow is testable.
    const isPaid = m.tier === "legacy";
    invoices.push({
      id: `inv-2026-${m.slug}`,
      memberSlug: m.slug,
      description: "2026 Annual Membership Dues",
      amount,
      issuedAt: "2026-01-05",
      dueAt: "2026-02-15",
      status: isPaid ? "paid" : "open",
      ...(isPaid ? { paidAt: "2026-01-18" } : {}),
    });
  }

  return { accounts, invoices, payments, memberOverrides: {}, jobs: [] };
}

function readStore(): PortalStoreData {
  if (!fs.existsSync(DATA_FILE)) {
    const data = seed();
    writeStore(data);
    return data;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as PortalStoreData;
}

function writeStore(data: PortalStoreData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* --- Accounts / auth ------------------------------------------------------ */

export function findAccount(email: string): PortalAccount | null {
  const store = readStore();
  return (
    store.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

export function verifyCredentials(email: string, password: string): PortalAccount | null {
  const account = findAccount(email);
  if (!account) return null;
  return account.passwordHash === hashPassword(password) ? account : null;
}

export function getAccountForMember(memberSlug: string): PortalAccount | null {
  const store = readStore();
  return store.accounts.find((a) => a.memberSlug === memberSlug) ?? null;
}

/* --- Invoices & payments -------------------------------------------------- */

export function getInvoicesForMember(memberSlug: string): Invoice[] {
  return readStore()
    .invoices.filter((i) => i.memberSlug === memberSlug)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function getInvoice(id: string): Invoice | null {
  return readStore().invoices.find((i) => i.id === id) ?? null;
}

export function getPaymentsForMember(memberSlug: string): PaymentRecord[] {
  return readStore()
    .payments.filter((p) => p.memberSlug === memberSlug)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export function getPayment(id: string): PaymentRecord | null {
  return readStore().payments.find((p) => p.id === id) ?? null;
}

/** Mark an invoice paid and record the (simulated) payment. */
export function recordPayment(invoiceId: string, last4: string): PaymentRecord {
  const store = readStore();
  const invoice = store.invoices.find((i) => i.id === invoiceId);
  if (!invoice) throw new Error(`Unknown invoice: ${invoiceId}`);
  if (invoice.status === "paid") throw new Error("Invoice is already paid.");

  const now = new Date().toISOString();
  const payment: PaymentRecord = {
    id: `pay-${crypto.randomBytes(6).toString("hex")}`,
    invoiceId,
    memberSlug: invoice.memberSlug,
    amount: invoice.amount,
    last4,
    paidAt: now,
  };
  invoice.status = "paid";
  invoice.paidAt = now.slice(0, 10);
  invoice.paymentId = payment.id;
  store.payments.push(payment);
  writeStore(store);
  return payment;
}

/* --- Write-back: profile edits and job postings --------------------------- */

export function getMemberOverrides(): Record<string, MemberProfileUpdate> {
  return readStore().memberOverrides;
}

export function updateMemberProfile(
  memberSlug: string,
  update: MemberProfileUpdate,
): void {
  const store = readStore();
  store.memberOverrides[memberSlug] = {
    ...store.memberOverrides[memberSlug],
    ...update,
  };
  writeStore(store);
}

export function getPortalJobs(): Job[] {
  return readStore().jobs;
}

export function addPortalJob(job: Job): void {
  const store = readStore();
  store.jobs.push(job);
  writeStore(store);
}
