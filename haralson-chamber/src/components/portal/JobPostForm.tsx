"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Job } from "@/lib/data";
import { jobTypeLabels } from "@/lib/format";

/** Write-back demo: post a job to the public board. */
export function JobPostForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "full-time",
    location: "",
    pay: "",
    summary: "",
    description: "",
    applyEmail: "",
    applyUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/portal/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; job?: Job };
    if (res.ok && data.job) {
      setPosted(data.job);
      router.refresh();
    } else {
      setError(data.error ?? "Posting failed. Try again.");
    }
    setBusy(false);
  };

  const inputClass =
    "mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm";

  if (posted) {
    return (
      <div className="rounded-xl bg-pine-50 p-5" role="status">
        <p className="font-display text-lg font-semibold text-pine-900">
          Posted! Your job is live on the public board.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          &ldquo;{posted.title}&rdquo; is now listed under {posted.company}.
        </p>
        <div className="mt-4 flex gap-4 text-sm font-semibold">
          <Link
            href={`/jobs/${posted.slug}`}
            className="text-clay-700 underline-offset-4 hover:underline"
          >
            View the public posting →
          </Link>
          <button
            type="button"
            onClick={() => {
              setPosted(null);
              setForm({
                title: "",
                type: "full-time",
                location: "",
                pay: "",
                summary: "",
                description: "",
                applyEmail: "",
                applyUrl: "",
              });
            }}
            className="text-pine-700 underline-offset-4 hover:underline"
          >
            Post another
          </button>
        </div>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="job-title" className="block text-sm font-semibold text-ink">
            Job title
          </label>
          <input
            id="job-title"
            type="text"
            required
            value={form.title}
            onChange={set("title")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="job-type" className="block text-sm font-semibold text-ink">
            Type
          </label>
          <select
            id="job-type"
            value={form.type}
            onChange={set("type")}
            className={inputClass}
          >
            {Object.entries(jobTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="job-pay" className="block text-sm font-semibold text-ink">
            Pay <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="job-pay"
            type="text"
            placeholder="$18–$22/hr"
            value={form.pay}
            onChange={set("pay")}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="job-location" className="block text-sm font-semibold text-ink">
            Location <span className="font-normal text-ink-soft">(defaults to your city)</span>
          </label>
          <input
            id="job-location"
            type="text"
            placeholder="Bremen, GA"
            value={form.location}
            onChange={set("location")}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="job-summary" className="block text-sm font-semibold text-ink">
            One-line summary
          </label>
          <input
            id="job-summary"
            type="text"
            required
            value={form.summary}
            onChange={set("summary")}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="job-description" className="block text-sm font-semibold text-ink">
            Full description
          </label>
          <textarea
            id="job-description"
            required
            rows={6}
            value={form.description}
            onChange={set("description")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="job-apply-email" className="block text-sm font-semibold text-ink">
            Application email
          </label>
          <input
            id="job-apply-email"
            type="email"
            value={form.applyEmail}
            onChange={set("applyEmail")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="job-apply-url" className="block text-sm font-semibold text-ink">
            …or application URL
          </label>
          <input
            id="job-apply-url"
            type="url"
            placeholder="https://…"
            value={form.applyUrl}
            onChange={set("applyUrl")}
            className={inputClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-clay-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-60"
      >
        {busy ? "Posting…" : "Post to the jobs board"}
      </button>
    </form>
  );
}
