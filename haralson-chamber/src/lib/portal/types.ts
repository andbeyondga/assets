import type { Job, Member } from "@/lib/data";

/**
 * Types for the member portal DEMO: login, dues/invoices, simulated
 * payments, and write-back (profile edits, job postings).
 *
 * Everything here is backed by a local JSON store (.data/portal.json) so the
 * whole flow can be tested with zero external services. In a real deployment
 * these operations would proxy to the AMS — see src/lib/portal/store.ts for
 * where each one would plug in.
 */

export interface PortalAccount {
  email: string;
  /** sha256(password + salt) — DEMO ONLY; a real system uses bcrypt/argon2. */
  passwordHash: string;
  memberSlug: string;
  contactName: string;
}

export type InvoiceStatus = "open" | "paid";

export interface Invoice {
  id: string;
  memberSlug: string;
  description: string;
  /** Whole US dollars. */
  amount: number;
  issuedAt: string; // ISO date
  dueAt: string; // ISO date
  status: InvoiceStatus;
  paidAt?: string;
  paymentId?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  memberSlug: string;
  amount: number;
  last4: string;
  paidAt: string; // ISO datetime
}

/** Fields a member may edit on their own listing. */
export type MemberProfileUpdate = Partial<
  Pick<Member, "tagline" | "description" | "phone" | "email" | "website" | "hours">
>;

export interface PortalStoreData {
  accounts: PortalAccount[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  /** Listing edits made through the portal, merged over the seed data. */
  memberOverrides: Record<string, MemberProfileUpdate>;
  /** Jobs posted through the portal, merged into the public jobs board. */
  jobs: Job[];
}
