import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/portal/auth";
import { ProfileForm } from "@/components/portal/ProfileForm";

export const metadata: Metadata = {
  title: "My Listing",
  robots: { index: false },
};

export default async function ProfilePage() {
  const session = (await getSession())!;
  const { member } = session;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-pine-900">
        Your directory listing
      </h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Edits save to{" "}
        <Link
          href={`/directory/${member.slug}`}
          className="font-semibold text-clay-700 underline-offset-4 hover:underline"
        >
          your public page
        </Link>{" "}
        immediately. Name, category, and address changes go through the chamber
        office so the directory stays tidy.
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-sand-200 bg-white p-6">
        <ProfileForm member={member} />
      </div>
    </div>
  );
}
