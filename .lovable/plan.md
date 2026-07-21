## Changes

### 1. Step 6 — Protein icon
In `src/pages/Onboarding.tsx`, change the `pains.protein` chip emoji from `🥩` (meat) to `🫘` (beans/lentils, plant-forward) so it doesn't imply meat is the only protein source. Label text stays "Protein" / "प्रोटीन".

### 2. Step 8 — Diet-aware allergy list (fix vegan)
Update `allowedAllergiesForDiet` in `src/pages/Onboarding.tsx` so vegan excludes `dairy` (currently vegan returns `dairy, nuts, gluten, soy`):

```text
vegan               -> nuts, gluten, soy
vegetarian, jain    -> dairy, nuts, gluten, soy
eggetarian          -> dairy, nuts, gluten, soy, eggs
pescatarian         -> dairy, nuts, gluten, soy, eggs, shellfish
nonVeg, keto, none  -> dairy, nuts, gluten, soy, eggs, shellfish
```

The existing filter already strips stale selections when the diet changes, so switching to vegan will drop a previously-picked dairy chip too.

### 3. Step 8 — User-added custom allergies as pills
Replace the current free-text "Other allergies" input with an add-your-own control:

- A text input + "Add" button (Enter also adds).
- On add, the value is trimmed, de-duped case-insensitively, and pushed into a new `customAllergies: string[]` list stored on the profile alongside `allergies`.
- Each custom entry renders as a chip next to the fixed chips, with a generic 🏷️ icon and an `×` to remove it. Custom chips are always "selected" (adding = selecting).
- The legacy `allergiesOther` string field is migrated on load: if present and `customAllergies` is empty, split by commas into the new array; then cleared.

`src/lib/nutrition-store.ts` gets a new `customAllergies: string[]` field on the profile (default `[]`) and the migration above in `getProfile`. `finish()` in `Onboarding.tsx` saves `customAllergies` instead of `allergiesOther`.

New i18n keys in `src/i18n/locales/en.json` and `hi.json` under `onboarding`:
- `allergiesAddLabel` — "Add another allergy"
- `allergiesAddPlaceholder` — "e.g. sesame, mustard, kiwi"
- `allergiesAddCta` — "Add"

Old `allergiesOtherLabel` / `allergiesOtherPlaceholder` keys are removed.

## Out of scope

- No changes to the diet step, hydration step, chip visuals elsewhere, or backend schema (profile is localStorage-only today).
- No autocomplete/suggestion dropdown for custom allergies — plain text entry only. If you want a suggested-list dropdown ("select New to add"), say so and I'll add a datalist of common allergens (sesame, mustard, kiwi, celery, sulphites, etc.).
