
## Plan: Lock auto-filled macros + flag approximate estimates

Building on the previously approved plan (persistent labels + faithful name). Two additions:

### Addition 1: Lock macro fields once AI fills them
After the AI (text or photo) returns nutrition values, the 8 macro inputs + the food-name field become **read-only**. User cannot edit numbers post-generation.

- Add a state flag `isAiFilled` in `src/pages/LogMeal.tsx`, set to `true` whenever the text or photo analysis successfully populates the form, reset to `false` when user clears/starts a new entry.
- Apply `readOnly` + a muted visual style (`bg-muted cursor-not-allowed`) to all 8 macro inputs and the name input when `isAiFilled` is true.
- Manual entry (user types macros from scratch without using AI) stays fully editable — the lock only triggers after an AI fill.
- Add a small "Clear & re-enter" link/button so the user can wipe the form and start over (manual or new AI attempt) if the values look wrong.

### Addition 2: Approximate-estimate banner
When the user describes a meal **verbally or in text without quantities** (e.g. "avocado with fried egg" — no "1", "2 slices", "100g", "katori", etc.), show a yellow info banner above the macro grid:

> ⚠️ **Approximate estimate.** We assumed standard portions. For accurate numbers, mention quantities (e.g. "2 eggs, 1 avocado") or snap a photo.

How we detect "no quantity":
- In `supabase/functions/analyze-food-text/index.ts`, add a new boolean field `quantitySpecified` to the tool schema. The AI sets it to `false` when the user did not state any explicit quantity/measure, `true` when they did (numbers, "katori", "cup", "slice", "piece", "g", "ml", etc.).
- Frontend reads `quantitySpecified` from the response and shows the banner when `false`.
- Photo analysis flow does NOT show this banner (a photo is already concrete evidence of portion).

### Files touched
- `src/pages/LogMeal.tsx` — add lock state, readOnly styling, "Clear & re-enter" button, approximate banner.
- `supabase/functions/analyze-food-text/index.ts` — add `quantitySpecified` field to schema + prompt instruction.

### Out of scope
- No changes to photo edge function.
- No changes to voice/timeout logic.
- No new dependencies.
