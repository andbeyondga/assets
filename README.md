# Atlas — Personal AI Assistant

A voice-first, memory-backed personal assistant for a creative director / video
production owner. Think Jarvis: hold to talk, it listens, thinks, and answers in
a custom voice — and it remembers things across conversations.

This repo is being built in phases. **Phase 1 (the brain) is live now**: a clean,
dark, mobile-optimized chat that talks to Claude. Voice and memory layer in next.

---

## Architecture

```
iPhone browser (React UI)
        │  speaks to your own backend only — never holds API keys
        ▼
Next.js API routes  ──►  Claude API        (brain)
                    ──►  ElevenLabs         (voice out)   [Phase 2]
                    ──►  Whisper / OpenAI   (voice in)    [Phase 2]
                    ──►  Supabase           (memory)      [Phase 3]
```

**Why Next.js and not a plain React app:** your Claude / ElevenLabs / OpenAI keys
must stay server-side. The phone talks to *your* API routes; those routes hold the
keys. A pure browser app would leak them.

---

## Build phases

- [x] **Phase 1 — Brain.** Claude API wired to a dark, mobile chat UI. Confirm the
      assistant thinks and responds with your context. *(you are here)*
- [ ] **Phase 2 — Voice.** Hold-to-talk → Whisper transcribes → Claude responds →
      ElevenLabs speaks it back in your custom voice.
- [ ] **Phase 3 — Memory.** Supabase stores clients, shoot dates, and decisions,
      and feeds them back into every conversation.
- [ ] **Phase 4 — Notes & reminders.** "Remind me…" / "Make a note…" persist and
      can surface later. (This workspace also has Calendar + Drive connected, which
      we can wire in for real reminders/notes.)

---

## Accounts you need to set up

Set these up in order. You only need the first one to run Phase 1.

| When | Service | What it's for | Where |
|------|---------|---------------|-------|
| **Now** | **Anthropic** | The brain (Claude API) | https://console.anthropic.com |
| Phase 2 | **ElevenLabs** | Voice output (your custom voice) | https://elevenlabs.io |
| Phase 2 | **OpenAI** | Whisper speech-to-text | https://platform.openai.com |
| Phase 3 | **Supabase** | Persistent memory + storage | https://supabase.com |
| Deploy  | **Vercel** | Host it so you can open it on your phone | https://vercel.com |

> Tip: in ElevenLabs, create or clone the voice you want Atlas to speak in, then
> copy its **Voice ID** — we'll need it in Phase 2.

---

## Run it locally (Phase 1)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your env file and add your Anthropic key:
   ```bash
   cp .env.example .env.local
   # then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 — type a message and confirm the brain responds.

### Try it on your phone (same Wi-Fi)
Run `npm run dev`, find your computer's local IP, and visit `http://<your-ip>:3000`
on the phone. For a real always-on URL, deploy to Vercel (below).

---

## Deploy (so it lives on your phone)

1. Push this repo to GitHub (already connected).
2. Import it at https://vercel.com → New Project.
3. Add the env vars from `.env.example` in Vercel's project settings.
4. Deploy. Open the URL on your iPhone and **Add to Home Screen** — it runs
   full-screen like a native app (configured in `app/layout.tsx`).

---

## Project structure

```
app/
  layout.tsx          # html shell, PWA / iOS full-screen meta, viewport
  page.tsx            # the one screen: transcript + composer
  globals.css         # dark theme, safe-area insets, animations
  api/chat/route.ts   # server route → Claude (holds the API key)
lib/
  anthropic.ts        # server-only Claude client + model id
  systemPrompt.ts     # who Atlas is + your operator context
  useChat.ts          # client conversation state
  types.ts            # shared message types
```

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Claude
(`claude-sonnet-4-20250514`) · ElevenLabs · Whisper · Supabase.
