import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import type { Job, JobType } from "@/lib/data";
import { getDataSource } from "@/lib/data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/portal/auth";
import { slugify } from "@/lib/data/growthzone";
import { addPortalJob } from "@/lib/portal/store";

const JOB_TYPES: JobType[] = ["full-time", "part-time", "contract", "seasonal"];

/** Write-back DEMO: members post jobs to the public board from the portal. */
export async function POST(req: NextRequest) {
  const memberSlug = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!memberSlug) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const member = await getDataSource().getMember(memberSlug);
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    type?: string;
    location?: string;
    pay?: string;
    summary?: string;
    description?: string;
    applyEmail?: string;
    applyUrl?: string;
  } | null;

  if (!body?.title?.trim() || !body.summary?.trim() || !body.description?.trim()) {
    return NextResponse.json(
      { error: "Title, summary, and description are required." },
      { status: 422 },
    );
  }
  if (!JOB_TYPES.includes(body.type as JobType)) {
    return NextResponse.json({ error: "Pick a valid job type." }, { status: 422 });
  }
  if (!body.applyEmail?.trim() && !body.applyUrl?.trim()) {
    return NextResponse.json(
      { error: "Provide an application email or URL." },
      { status: 422 },
    );
  }
  if (body.applyUrl && !/^https?:\/\//.test(body.applyUrl.trim())) {
    return NextResponse.json(
      { error: "Application URL must start with http:// or https://." },
      { status: 422 },
    );
  }

  const suffix = crypto.randomBytes(3).toString("hex");
  const job: Job = {
    id: `job-portal-${suffix}`,
    slug: `${slugify(body.title)}-${suffix}`,
    title: body.title.trim(),
    company: member.name,
    memberSlug: member.slug,
    location: body.location?.trim() || `${member.address.city}, GA`,
    type: body.type as JobType,
    ...(body.pay?.trim() ? { pay: body.pay.trim() } : {}),
    summary: body.summary.trim(),
    description: body.description.trim(),
    postedAt: new Date().toISOString().slice(0, 10),
    ...(body.applyUrl?.trim() ? { applyUrl: body.applyUrl.trim() } : {}),
    ...(body.applyEmail?.trim() ? { applyEmail: body.applyEmail.trim() } : {}),
  };

  addPortalJob(job);
  return NextResponse.json({ ok: true, job });
}
