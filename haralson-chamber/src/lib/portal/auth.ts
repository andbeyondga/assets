import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { Member } from "@/lib/data";
import { getDataSource } from "@/lib/data";
import type { PortalAccount } from "./types";
import { getAccountForMember } from "./store";

/**
 * DEMO session handling: an HMAC-signed cookie carrying the member slug.
 * Good enough to exercise the portal end to end; a production system would
 * use a real session/identity provider (or the AMS's own SSO).
 */

export const SESSION_COOKIE = "portal_session";

const SECRET = process.env.PORTAL_SESSION_SECRET ?? "haralson-portal-demo-secret";

function sign(slug: string): string {
  return crypto.createHmac("sha256", SECRET).update(slug).digest("hex").slice(0, 32);
}

/** Cookie value for a logged-in member. */
export function createSessionToken(memberSlug: string): string {
  return `${memberSlug}:${sign(memberSlug)}`;
}

/** Member slug from a cookie value, or null if missing/tampered. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(":");
  if (idx === -1) return null;
  const slug = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(slug);
  if (sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ? slug
    : null;
}

export interface Session {
  account: PortalAccount;
  member: Member;
}

/** The logged-in member for the current request, or null. (Server only.) */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const slug = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!slug) return null;
  const account = getAccountForMember(slug);
  if (!account) return null;
  const member = await getDataSource().getMember(slug);
  if (!member) return null;
  return { account, member };
}
