# Greater Haralson Chamber — Public Website

A modern, fully customizable public website and member directory for the
Greater Haralson Chamber of Commerce (Haralson County, Georgia), replacing the
locked-down GrowthZone front end.

**Read-only by design.** This site displays members, events, jobs, and news.
Payments, dues, member login, and record management stay in the association
management system (AMS) — nothing here writes back.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Static generation for every page — no backend needed to run or deploy
- Client-side search/filter for the directory and events

## Run it

```bash
npm install
npm run dev       # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

The demo runs entirely on local seed data — no API keys, no network calls.

## Project layout

```
src/
├── app/                    # Routes (App Router)
│   ├── page.tsx            # Home
│   ├── about/  board-staff/  membership/  programs/
│   ├── ribbon-cuttings/  contact/          # Marketing pages
│   ├── directory/          # Searchable directory
│   │   ├── [slug]/         #   Member profile pages
│   │   └── category/[slug]/#   Category landing pages
│   ├── events/ + [slug]/   # List + calendar views, event pages
│   ├── jobs/ + [slug]/     # Jobs board
│   ├── news/ + [slug]/     # News & member spotlights
│   ├── theme.css           # <-- Brand colors & font hookup (edit to rebrand)
│   ├── sitemap.ts robots.ts not-found.tsx
├── components/             # UI building blocks (cards, explorers, layout)
├── config/site.ts          # <-- Site name, contact info, nav links
├── content/board.ts        # <-- Board & staff listings
├── data/*.json             # <-- Seed content (members, events, jobs, news)
└── lib/
    ├── data/
    │   ├── types.ts        # Shared domain types (the UI's contract)
    │   ├── source.ts       # ChamberDataSource interface
    │   ├── mock.ts         # Mock source reading src/data/*.json (default)
    │   ├── growthzone.ts   # Live AMS adapter stub (wire up later)
    │   └── index.ts        # getDataSource() — picks mock vs live
    └── format.ts           # Date/label helpers
```

## Editing content

All demo content is plain files — edit, save, refresh:

| What                          | Where                                     |
| ----------------------------- | ----------------------------------------- |
| Members, categories           | `src/data/members.json`, `categories.json`|
| Events                        | `src/data/events.json`                    |
| Jobs                          | `src/data/jobs.json`                      |
| News & spotlights             | `src/data/news.json`                      |
| Board & staff                 | `src/content/board.ts`                    |
| Site name, phone, nav, social | `src/config/site.ts`                      |
| Marketing page copy           | The page files in `src/app/…/page.tsx`    |

Field shapes are documented in `src/lib/data/types.ts` — every JSON record
must match its type (`npm run build` will tell you if one doesn't).

### Rebranding (colors & fonts)

- **Colors:** edit the hex values in `src/app/theme.css`. The palette is three
  ramps — `pine` (primary), `clay` (accent), `sand`/`cream` (neutrals) — and
  every component uses them, so changing the ramp rebrands the whole site.
- **Fonts:** swap the two `next/font` imports at the top of
  `src/app/layout.tsx` (currently Fraunces + Source Sans 3). The CSS variables
  they set (`--font-heading`, `--font-body`) feed the theme automatically.

## Swapping in a live data source later

Every page fetches through one interface — `ChamberDataSource` in
`src/lib/data/source.ts` — with two implementations:

1. **`MockDataSource`** (default): reads the JSON seed files. Zero deps.
2. **`GrowthZoneDataSource`** (`src/lib/data/growthzone.ts`): a commented stub
   ready for the GrowthZone API or a replacement AMS.

To go live:

1. Add credentials to `.env.local` (never commit this file):
   ```bash
   DATA_SOURCE=live
   AMS_API_BASE_URL=https://…      # the AMS API base URL
   AMS_API_KEY=…                   # the AMS API key/token
   ```
2. Implement the `TODO`s in `growthzone.ts`: fetch each endpoint and map the
   raw response into the types from `types.ts`. The comments in the file mark
   exactly where endpoints and credentials go.
3. That's it. No UI changes — the components only ever see the shared types.

Because pages are statically generated, redeploying (or configuring Next.js
revalidation, noted in `growthzone.ts`) refreshes site content from the AMS.

## Accessibility & SEO checklist (already wired in)

- Semantic landmarks, skip link, labeled form controls, visible focus rings
- Per-page `<title>`/description metadata, Open Graph basics
- `sitemap.xml` and `robots.txt` generated from the data source
- Set the production domain in `src/config/site.ts` (`site.url`) before launch
