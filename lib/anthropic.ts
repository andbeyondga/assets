import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side Anthropic client. This module must only ever be imported from
 * server code (API routes / server components) so the API key never reaches
 * the browser.
 */

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// The model that powers the assistant's brain.
export const BRAIN_MODEL = "claude-sonnet-4-20250514";
