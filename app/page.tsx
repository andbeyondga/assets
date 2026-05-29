"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/useChat";

export default function Home() {
  const { messages, isThinking, error, send, clear } = useChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the transcript pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  async function handleSend() {
    const text = draft;
    setDraft("");
    await send(text);
  }

  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-edge px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Atlas</span>
          <span className="rounded-full bg-panel px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
            text · phase 1
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-muted transition-colors hover:text-accent"
          >
            Clear
          </button>
        )}
      </header>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {messages.length === 0 && !isThinking && (
          <div className="mt-24 text-center text-muted">
            <p className="text-sm">The brain is online.</p>
            <p className="mt-1 text-xs">Ask it anything to confirm it&apos;s working.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2.5 text-sm text-[#eaf3ff]"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-panel px-4 py-2.5 text-sm text-[#e9e9ec]"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-panel px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Composer (Phase 2 swaps/adds a hold-to-talk button here) */}
      <div className="border-t border-edge px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl bg-panel px-3 py-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Message Atlas…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-white placeholder:text-muted focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isThinking}
            className="mb-0.5 rounded-xl bg-accent px-3.5 py-1.5 text-sm font-medium text-ink transition-opacity disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
