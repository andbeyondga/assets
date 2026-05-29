"use client";

import { useCallback, useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface UseChat {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  clear: () => void;
}

/**
 * Client-side conversation state. Talks to /api/chat (which holds the key).
 * Phase 1: text only. Phase 2 will feed transcribed speech into send() and
 * pipe the reply into ElevenLabs.
 */
export function useChat(): UseChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      setError(null);
      const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setIsThinking(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Request failed.");
        }

        const reply: string = (data?.reply || "").trim();
        if (!reply) throw new Error("Empty response from the assistant.");

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsThinking(false);
      }
    },
    [messages, isThinking]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isThinking, error, send, clear };
}
