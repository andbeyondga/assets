"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/data";

/** Write-back demo: edit the member's public directory listing. */
export function ProfileForm({ member }: { member: Member }) {
  const router = useRouter();
  const [form, setForm] = useState({
    tagline: member.tagline,
    description: member.description,
    phone: member.phone,
    email: member.email ?? "",
    website: member.website ?? "",
    hours: member.hours ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [field]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/portal/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Save failed. Try again.");
    }
    setBusy(false);
  };

  const inputClass =
    "mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-clay-50 px-3 py-2 text-sm text-clay-800">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-md bg-pine-50 px-3 py-2 text-sm text-pine-800">
          Saved — your public listing is updated.
        </p>
      )}
      <div>
        <label htmlFor="profile-tagline" className="block text-sm font-semibold text-ink">
          Tagline <span className="font-normal text-ink-soft">(shows on directory cards)</span>
        </label>
        <input
          id="profile-tagline"
          type="text"
          required
          value={form.tagline}
          onChange={set("tagline")}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="profile-description" className="block text-sm font-semibold text-ink">
          Description
        </label>
        <textarea
          id="profile-description"
          required
          rows={6}
          value={form.description}
          onChange={set("description")}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Separate paragraphs with a blank line.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-phone" className="block text-sm font-semibold text-ink">
            Phone
          </label>
          <input
            id="profile-phone"
            type="tel"
            required
            value={form.phone}
            onChange={set("phone")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-website" className="block text-sm font-semibold text-ink">
            Website
          </label>
          <input
            id="profile-website"
            type="url"
            placeholder="https://…"
            value={form.website}
            onChange={set("website")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-hours" className="block text-sm font-semibold text-ink">
            Hours
          </label>
          <input
            id="profile-hours"
            type="text"
            placeholder="Mon–Fri 9am–5pm"
            value={form.hours}
            onChange={set("hours")}
            className={inputClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-pine-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-800 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
