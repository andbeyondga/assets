import { NextRequest, NextResponse } from "next/server";
import { getAnthropic, BRAIN_MODEL } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { ChatRequestBody, ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40; // keep request payloads sane

function isValidMessage(m: unknown): m is ChatMessage {
  if (typeof m !== "object" || m === null) return false;
  const msg = m as Record<string, unknown>;
  return (
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    msg.content.trim().length > 0
  );
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = Array.isArray(body?.messages)
    ? body.messages.filter(isValidMessage).slice(-MAX_MESSAGES)
    : [];

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "No valid messages provided." },
      { status: 400 }
    );
  }

  try {
    const anthropic = getAnthropic();

    const response = await anthropic.messages.create({
      model: BRAIN_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error talking to the brain.";
    // Surface a clean message to the client; log the full error server-side.
    console.error("[/api/chat] error:", err);
    const isKeyError = message.includes("ANTHROPIC_API_KEY");
    return NextResponse.json(
      { error: isKeyError ? message : "The assistant couldn't respond. Try again." },
      { status: isKeyError ? 500 : 502 }
    );
  }
}
