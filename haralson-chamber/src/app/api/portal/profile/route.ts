import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/portal/auth";
import { updateMemberProfile } from "@/lib/portal/store";
import type { MemberProfileUpdate } from "@/lib/portal/types";

const EDITABLE_FIELDS = [
  "tagline",
  "description",
  "phone",
  "email",
  "website",
  "hours",
] as const;

/** Write-back DEMO: members update their own public listing. Changes land in
 *  the portal store and are merged into the directory by the data layer. */
export async function POST(req: NextRequest) {
  const memberSlug = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!memberSlug) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: MemberProfileUpdate = {};
  for (const field of EDITABLE_FIELDS) {
    const value = body[field];
    if (typeof value === "string") {
      update[field] = value.trim();
    }
  }

  if (!update.tagline || !update.description || !update.phone) {
    return NextResponse.json(
      { error: "Tagline, description, and phone are required." },
      { status: 422 },
    );
  }
  if (update.website && !/^https?:\/\//.test(update.website)) {
    return NextResponse.json(
      { error: "Website must start with http:// or https://." },
      { status: 422 },
    );
  }

  updateMemberProfile(memberSlug, update);
  return NextResponse.json({ ok: true });
}
