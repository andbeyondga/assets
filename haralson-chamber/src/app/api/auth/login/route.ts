import { type NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/portal/store";
import { createSessionToken, SESSION_COOKIE } from "@/lib/portal/auth";

/** DEMO login: checks credentials against the local portal store and sets
 *  the signed session cookie. A live deployment would authenticate against
 *  the AMS (or an identity provider) here instead. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const account = verifyCredentials(body.email, body.password);
  if (!account) {
    return NextResponse.json(
      { error: "No account with that email and password. (Demo password: chamber-demo)" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true, memberSlug: account.memberSlug });
  res.cookies.set(SESSION_COOKIE, createSessionToken(account.memberSlug), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
