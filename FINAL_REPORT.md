# Final Report: Ad Analytics Feature + Data‑Loss Incident

## Recovery

The single `publicite` row (id `1eba0686‑18d8‑45af‑81d0‑9d501a6f2278`) that was accidentally deleted by the first buggy test run has been **surgically restored** with **100% field fidelity**:

| Field              | Value |
|--------------------|-------|
| id                 | 1eba0686‑18d8‑45af‑81d0‑9d501a6f2278 |
| title              | Salle à Mangé 4 Pls Ouverte |
| description        | Malheureusement nous ne pouvons pas vérifier cette informations en ce moment |
| image              | (image téléchargée) |
| price              | 12000 |
| priceLabel         | slode |
| location           | Douala Akwa |
| phone              | +237659169960 |
| linkUrl            | https://petchcrea.com/under-desk-storage/ |
| slot               | home_hero |
| status             | active |
| startAt            | 2026‑10‑13T19:05:00.000Z |
| endAt              | 2026‑10‑13T19:15:00.000Z |
| createdAt          | 2026‑10‑13T17:57:33.621Z |
| updatedAt          | 2026‑10‑13T19:02:45.563Z |

The restoration used the app's own Drizzle mapper with `new Date(isoString)` round‑trips, verified by read‑back comparison of all 16 fields (`RESTORE_OK`). The data was recovered from the Next.js build artifact `.next/server/app/index.rsc`, which was prerendered during `pnpm build` *before* the destructive test.

**Incident disclosure:** The first run of `__tests__/publicite-analytics-tests.ts` used a local helper named `eq` that shadowed drizzle's `eq`, so `db.delete(publicite).where(eq(publicite.id, tempId))` became `where(undefined)` → **deleted every row in `publicite`**, including the one pre‑existing ad, with cascade to `publicite_event`. `PUBLICITE_ROWS` went from 1 to 0. The helper was immediately renamed to `expectEq`; all subsequent test runs (68 unit + 26 HTTP) pass cleanly. No further destructive DB ops occur.

**Recovery path:** Neon PITR was the intended full‑restore mechanism but is blocked by the absence of a `NEON_API_KEY` in `.env` and no local seed/dump. The build‑artifact reconstruction is the practical resolution achieved.

## Changes Made

| Category | File(s) |
|----------|---------|
| **DB schema** | `db/schema.ts` — `publiciteEvent` table definition added after `publicite` |
| **Migration** | `drizzle/0012_publicite_event.sql` — 5‑statement additive migration, `IF NOT EXISTS` idempotent |
| **Analytics helpers** | `lib/publicite-analytics.ts` — pure helpers (`classifySource`, `computeRates`, `parseDateInput`, `resolveAnalyticsRange`, `buildDayBuckets`, all types) |
| **Attribution** | `lib/publicite-attribution.ts` — cookie serialize/parse, 30‑day window, idempotent `recordConversion` |
| **Stats** | `lib/publicite-stats.ts` — server aggregation `getPubliciteStats` via Drizzle |
| **API route** | `app/api/ads/event/route.ts` — POST impression/click; consent required; staff dropped; dedupe; sets `gz_ad_ref` cookie |
| **Ads client** | `lib/ads-client.ts` — consent‑gated `sendImpressionEvent`/`sendClickEvent`, `CONSENT_EVENT` |
| **Admin UI** | `app/_components/admin-publicite-stats.tsx` — KPI cards, recharts, per‑ad table, period controls |
| **Banner component** | `app/_components/publicite-banner.tsx` — IntersectionObserver impression + click tracking |
| **Marketing page** | `app/admin/(protected)/marketing/page.tsx` — reads `searchParams` (Promise), renders stats |
| **Conversion hooks** | `app/api/recherche/route.ts`, `app/api/reservation/create/route.ts`, `lib/auth.ts` |
| **Privacy policies** | `app/politique-cookies/page.tsx`, `app/politique-confidentialite/page.tsx` — date updated to 14 octobre 2026 |
| **Test suites** | `__tests__/publicite-analytics-tests.ts`, `__tests__/publicite-tracking-http.mjs` |

## Tests Executed

| Suite | Result |
|-------|--------|
| `__tests__/publicite-analytics-tests.ts` | **68 PASS / 0 FAIL** (run via `npx tsx`) |
| `__tests__/publicite-tracking-http.mjs` | **26 PASS / 0 FAIL** (run via `node`) |

Both test suites cover: tracking events, rate calculation, date filters, source classification, deduplication, cookie attributes, conversion via `/api/recherche` + idempotence, cascade cleanup. The test‑helper name collision (`eq` vs drizzle `eq`) was fixed by renaming to `expectEq`; no `where(undefined)` can occur again.

## Data‑Loss Incident (honest)

- **When:** first run of `__tests__/publicite-analytics-tests.ts` during development.
- **Root cause:** local `eq` helper shadowed drizzle's `eq`; `where(undefined)` → `DELETE FROM publicite` with no `WHERE` clause → all rows deleted.
- **Impact:** the single pre‑existing ad (slot `home_hero`, status `active`, image `"(image téléchargée)"`, past dates) and its events were lost; all other tables remained intact.
- **Fix:** helper renamed to `expectEq`; the row was restored from the Next.js build artifact (not from Neon PITR, which requires API access unavailable locally).
- **Prevention:** all test cleanups now use drizzle's `eq` directly; no custom `eq` helper is injected.

## Recommendations

- The feature is production‑ready: migrations, schema, API, UI, tests all verified (tsc 0 errors, eslint 0 errors on changed files, build succeeded).
- Keep `__tests__/` scripts — they provide good coverage and the collision bug is resolved.
- Remove / archive the two debug temp files that were in the project root (already deleted).
- The admin account `petchouko@gmail.com` (role admin) should not have its password reset.
- For a fully point‑in‑time Neon restore, the user would need to act in the Neon console (no local API key available).