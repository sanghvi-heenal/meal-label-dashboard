## 1. Fiber alert only after first meal

In `src/lib/insights.ts` → `buildRisk`, gate the "Fiber is very low" branch on `meals.length > 0` (and require `totals.calories > 0`) so a fresh, empty day never triggers it. Other risks (sodium, sugar, drink calories, carb/protein imbalance, sat fat) already depend on logged totals, but add the same guard defensively where a target-fraction check could fire on zeros.

## 2. Ideas only load on explicit filter tap

In `src/pages/Suggestions.tsx`:

- Change `mealType` state to allow `null` and default to `null` (drop the `autoPickMealType()` initial call).
- In the `useEffect` that calls `fetchIdeas`, skip when `mealType` is `null`.
- In `IdeasFilters` (`src/components/suggestions/IdeasFilters.tsx`), update the type to `MealTypeFilter | null`, treat `null` as "nothing selected" (no pill active), and remove the "all" pill so the user must pick Breakfast / Lunch / Snack / Dinner.
- Show an empty prompt card before any selection: "Pick a meal to see ideas" (new i18n key `suggestions.pickMealPrompt` in `en.json` + `hi.json`).
- Hide the "Ideas for you" subtitle line that interpolates `{type}` until a selection exists.

## 3. Explain Light vs Heavy

In `src/components/suggestions/IdeasFilters.tsx`, add a small label above the Light/Heavy segmented control: "What kind of meal do you want?" plus a one-line helper: "Light = under ~350 kcal, easy to digest. Heavy = filling, ~500+ kcal." New i18n keys: `suggestions.filters.weightPrompt` and `suggestions.filters.weightHelp` in both locale files.

## 4. Remove broken YouTube search fallback

In `src/components/suggestions/IdeaCard.tsx`:

- Only render the hero media + Play overlay + "Watch recipe" button when `idea.youtubeId` is present (real embeddable video).
- When there is no `youtubeId`:
  - Drop the hero image block entirely (or show a plain colored header with the calorie chip — no play button, no link).
  - Do NOT render the "Search on YouTube" fallback button. Keep the "Read article" button if `articleUrl` exists; otherwise show no external CTA.
- Same treatment in `src/components/suggestions/SwapCard.tsx` if it has an equivalent YouTube-search fallback (verify during build).

Net effect: users only see a YouTube link when it will actually play; otherwise the card stays informational.

## Technical notes

- Files: `src/lib/insights.ts`, `src/pages/Suggestions.tsx`, `src/components/suggestions/IdeasFilters.tsx`, `src/components/suggestions/IdeaCard.tsx`, `src/components/suggestions/SwapCard.tsx` (conditional), `src/i18n/locales/en.json`, `src/i18n/locales/hi.json`.
- No backend/edge-function changes — the suggest-meals function already returns `youtubeId` when found; we simply stop rendering the broken fallback.
- No data-model changes.
