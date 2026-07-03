"use client";

import { useState } from "react";
import { site } from "@/config/site";

const TOPICS = [
  "Becoming a member",
  "Events & sponsorships",
  "Ribbon cutting request",
  "Jobs board posting",
  "News / member spotlight",
  "Something else",
];

/**
 * No-backend contact form: composes a mailto link so the visitor's own email
 * app sends the message. If a form-handling service (or the AMS) is wired up
 * later, swap the submit handler — the fields won't need to change.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[Website] ${topic} — ${name}`;
    const body = `${message}\n\n— ${name}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-semibold text-ink">
          Your name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="contact-topic" className="block text-sm font-semibold text-ink">
          What&apos;s this about?
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3 py-2.5 text-sm"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-semibold text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand-300 bg-cream px-3.5 py-2.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-clay-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-700"
      >
        Open in your email app
      </button>
    </form>
  );
}
