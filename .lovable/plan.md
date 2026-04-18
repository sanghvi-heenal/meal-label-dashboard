
## Plan: Enable photo + voice + text describe flow for Tea & Coffee

### Why
Tea/coffee calories vary wildly (black vs with sugar/milk/cream/syrup). Quick-logging a fixed default misrepresents intake. Let users describe these the same way as "Other" drinks.

### Change

In `src/pages/LogMeal.tsx`, the drink presets currently quick-log Tea and Coffee with a fixed volume/calorie default. Update so that tapping **Tea** or **Coffee** opens the existing `DrinkDescribeSheet` (same one used by "Other") — pre-seeded with the drink type as context so the AI knows it's tea/coffee.

Keep **Water** as the only true quick-log (no AI needed — pure hydration). Smoothie, Soup, Alcohol, Juice, Milk, Other → also route to the describe sheet (consistent UX, since all of these have variable nutrition).

### Implementation

**`src/components/DrinkDescribeSheet.tsx`**
- Add an optional `presetType?: string` prop (e.g. "tea", "coffee", "smoothie").
- When provided:
  - Sheet title becomes "Describe your {presetType}".
  - Pre-fill the text area with a soft hint like `"Tea — "` so the AI gets the category, and update placeholder to a relevant example (e.g. "e.g. masala chai with sugar and milk, ~200ml").
  - Pass `presetType` to the edge functions so they bias toward that beverage category.

**`src/pages/LogMeal.tsx`**
- Replace the per-preset quick-log handlers for Tea/Coffee/Smoothie/Soup/Alcohol/Juice/Milk/Other with a single handler that opens `DrinkDescribeSheet` with the matching `presetType`.
- Water keeps current quick-log behavior.
- Track which preset opened the sheet via state (e.g. `describePreset: string | null`).

**`supabase/functions/analyze-food/index.ts` & `analyze-food-text/index.ts`**
- Accept optional `presetType` field. Append to the prompt: *"The user indicated this is a {presetType}. Use that as the primary classification and estimate calories accordingly (e.g. black tea ≈ 2 kcal, tea with sugar+milk ≈ 60-90 kcal)."*

### UX detail
- Tea/Coffee tiles get a small ✨ sparkle icon hint to signal "AI-described, not quick-logged" — so users understand why a tap opens a sheet instead of instant-saving.

### Files touched
- `src/pages/LogMeal.tsx` — route presets to describe sheet
- `src/components/DrinkDescribeSheet.tsx` — accept & use `presetType`
- `supabase/functions/analyze-food/index.ts` — accept `presetType` in prompt
- `supabase/functions/analyze-food-text/index.ts` — accept `presetType` in prompt

### Out of scope
- Changing Water behavior (stays instant quick-log)
- Saving favorites / "remember my usual coffee" (separate feature)
