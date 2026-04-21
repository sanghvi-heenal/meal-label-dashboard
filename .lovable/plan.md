

## Plan: Visual Ideas page — YouTube + article cards, filters, caching, and post-meal alert

A 5-step build that turns the **Ideas** page into a visual recipe grid powered by YouTube thumbnails and Open Graph article previews, personalized by diet, allergies, meal type, and meal weight, with safe daily caching.

I'll build this in phases and pause for you to verify after each phase.

### Phase 1 — User preferences (allergies + finer meal context)

Profile (`src/lib/nutrition-store.ts`) gains:
- `allergies: string[]` (e.g. `["dairy","nuts","gluten"]`)
- `healthGoal: string` — derived from existing `goals[0]` (no UI change; reused as a clear single signal for the AI)

UI additions:
- **Onboarding** — new optional "Any allergies?" multi-select chip step (Dairy, Nuts, Gluten, Eggs, Shellfish, Soy, + "Other" free text). Skippable.
- **Settings → About you** — same allergy chips, editable any time.

No DB migration needed — profile lives in `localStorage`.

### Phase 2 — Upgrade `suggest-meals` edge function

New request body:
```ts
{
  meals, remaining, dietType, goals, language, // existing
  allergies: string[],
  healthGoal: string,
  mealType: "breakfast"|"lunch"|"dinner"|"snack",
  mealWeight: "light"|"heavy",
  deficits: { protein, fiber, calories }
}
```

AI tool schema returns per suggestion:
`name, calories, protein, carbs, fat, fiber, tags[], benefitLine, searchQuery`

Then the function enriches each result in parallel:
- **YouTube** — reuse existing `findYoutubeVideo()` (uses `YOUTUBE_API_KEY`). Only stores `youtubeWatchUrl` (`https://www.youtube.com/watch?v=<id>`), `youtubeThumbnailUrl` (`https://img.youtube.com/vi/<id>/hqdefault.jpg`), `youtubeTitle`, `channelTitle`, plus `youtubeSearchUrl` fallback. **No iframe ever.**
- **Article (optional, graceful)** — new helper `findArticle(query)`:
  1. Google Custom Search call: `q = "<searchQuery> recipe" + site filter (healthline, eatingwell, bbcgoodfood, bonappetit)`, using `GOOGLE_SEARCH_API_KEY` + `GOOGLE_CSE_ID`.
  2. Fetch top result HTML, extract `og:title`, `og:image`, `og:description` with regex (lightweight, no parser dep).
  3. Return `{ articleUrl, articleTitle, articleImage, articleDescription }`. If keys missing or no result → omit.

Final shape per suggestion matches your spec exactly.

### Phase 3 — Server-side daily cache (`cached_ideas` table)

New table via migration:
```text
cached_ideas (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null,
  diet_type text not null,
  meal_type text not null,
  meal_weight text not null,
  suggestions jsonb not null,
  created_at timestamptz default now(),
  unique (user_id, diet_type, meal_type, meal_weight)
)
```

- RLS on. Policies: users can `select`/`insert`/`update`/`delete` rows where `user_id = auth.uid()`.
- Frontend reads: `select * where user_id = me AND diet_type = X AND meal_type = Y AND meal_weight = Z AND created_at > now() - 24h`. If hit → render. If miss → call edge function, then `upsert` the row.
- Edge function itself does NOT touch the table — it stays a pure compute function. Caching is owned by the client (single source of truth, simpler).

> Requires auth. Today the app has no Supabase auth flow. Confirms below in "What you need to decide".

### Phase 4 — Ideas page UI

`src/pages/Suggestions.tsx`:
- New **filter chip bar** at top of the suggestions area (horizontal scroll):
  - Meal type: **All · Breakfast · Lunch · Dinner · Snack**
  - Weight: **Light · Heavy**
  - Selecting a combo → check cache → render or fetch.
  - Default selection: `All` + `Light` (or auto-pick by current time of day).
- **Section header**: "Ideas for you · Tap to watch or read recipes". Shows a subtle "Refreshing…" pill when a stale-revalidation fetch is in-flight while old cards are still on screen.
- New **`IdeaCard`** component (`src/components/suggestions/IdeaCard.tsx`):

```text
┌──────────────────────────────────────┐
│  [YouTube thumbnail]            ▶    │  ← whole image links to youtubeWatchUrl, target=_blank
├──────────────────────────────────────┤
│  Keto Egg Muffins         210 kcal   │
│  "Adds 18g protein, fills gap today" │
│  P 18g · C 3g · F 14g · Fib 1g       │
│  [keto] [high-protein] [snack]       │
│  ┌────────────────────┐ ┌──────────┐ │
│  │ ▶ Watch on YouTube │ │ 📄 Article│ │
│  └────────────────────┘ └──────────┘ │
└──────────────────────────────────────┘
```

- Article button only renders when `articleUrl` exists; opens in a new tab.
- Loading: 3 shimmer skeleton cards.
- Cache key bumped to `nutrilens-suggestions-cache-v3`; old text cards no longer render.
- **Delete** `src/components/suggestions/SuggestionCard.tsx`.

The existing **search bar** (top of page, healthier-versions search) stays unchanged.

### Phase 5 — High-calorie post-log alert

Already triggered after meal save (LogMeal toast). Extend to a **bottom sheet** when the just-logged meal exceeds a threshold (default: meal calories > 35% of `calorieTarget` OR > 600 kcal):
- Title: *"That was a high-calorie meal. Here are lighter ideas next time 👇"*
- Body: 2 `IdeaCard`s with `mealType = <same as logged>` and `mealWeight = "light"` from cache (or 2 skeletons + fetch in background).
- Footer: **"See all ideas →"** → navigates to `/suggestions?mealType=<x>&weight=light`.

Uses the existing `Sheet` component.

### What we will NOT build (per your spec)

- No inline YouTube iframe / embedded player — opens in new tab only.
- No Instagram / Pinterest integration.
- No Google CSE call when `GOOGLE_SEARCH_API_KEY` or `GOOGLE_CSE_ID` is missing — article section silently omitted.

### Files

**New**
- `src/components/suggestions/IdeaCard.tsx`
- `src/components/suggestions/MealFilterBar.tsx`
- `src/components/suggestions/HighCalorieIdeasSheet.tsx`
- DB migration creating `cached_ideas` + RLS policies

**Edited**
- `supabase/functions/suggest-meals/index.ts` — new inputs, YouTube + article enrichment, new return shape
- `src/pages/Suggestions.tsx` — filter bar, server cache check, IdeaCard rendering, v3 cache key
- `src/pages/LogMeal.tsx` — high-calorie sheet trigger after save
- `src/pages/Onboarding.tsx` — allergies step
- `src/pages/SettingsPage.tsx` — allergies edit
- `src/lib/nutrition-store.ts` — `allergies`, `healthGoal`
- `src/i18n/locales/en.json` & `hi.json` — new keys

**Deleted**
- `src/components/suggestions/SuggestionCard.tsx`

### Secrets needed

- `YOUTUBE_API_KEY` — already configured? I'll verify; if missing, cards still render with thumbnails via `https://img.youtube.com/vi/<id>/hqdefault.jpg` only when we have a `youtubeId`, else the thumbnail spot just shows a search icon and the button becomes "Search on YouTube". (To get real `youtubeId`s + titles, the key is required.)
- `GOOGLE_SEARCH_API_KEY` and `GOOGLE_CSE_ID` — optional; without them the 📄 Article button never appears. Get from Google Cloud Console → Custom Search JSON API + programmablesearchengine.google.com (CSE restricted to healthline.com, eatingwell.com, bbcgoodfood.com, bonappetit.com).

I'll request these via the secrets tool when we reach Phase 2.

### What you need to decide before I start

1. **Auth**: server-side `cached_ideas` per user requires Supabase Auth (email/password + Google). The app currently has no login screen. Three options:
   - **(a) Add full email + Google auth now** as part of Phase 3 (recommended; needed for multi-device anyway).
   - **(b) Keep cache in `localStorage` only** (per-device, no auth) — simpler, but each device re-spends YouTube quota on first load.
   - **(c) Anonymous Supabase sessions** — gives a stable per-device user_id without a login screen.
2. **Filter defaults**: "All + Light" always, or auto-pick meal type by clock (breakfast 5–11, lunch 11–16, snack 16–18, dinner 18–23)?
3. **High-calorie threshold**: stick with `meal kcal > 35% of daily target OR > 600 kcal`, or set a fixed number (e.g. > 700)?

Reply with **1: a/b/c**, **2: all/auto**, **3: 35%/700/your number**, and I'll start Phase 1.

