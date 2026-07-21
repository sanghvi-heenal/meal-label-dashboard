## Goal

Make onboarding smarter: filter allergy chips by chosen diet, and reword the hydration step so the main question is about today's hydration level.

## Step 8 — Diet-aware allergies

Filter the allergy chip list in `src/pages/Onboarding.tsx` based on `diet[0]`.

Mapping (animal-derived allergens only shown when the diet includes them):
- `vegan`: dairy, nuts, gluten, soy (no eggs, no shellfish)
- `vegetarian`, `jain`: dairy, nuts, gluten, soy (no eggs, no shellfish)
- `eggetarian`: dairy, nuts, gluten, soy, eggs
- `pescatarian`: dairy, nuts, gluten, soy, eggs, shellfish
- `nonVeg`: all six (dairy, nuts, gluten, eggs, shellfish, soy)
- `keto`, `none` (Balanced): all six

Also strip any previously-selected allergies that are no longer valid for the chosen diet when entering step 8, so a user who picks shellfish, then switches to vegetarian, doesn't silently keep it.

## Step 9 — Hydration wording

Update `src/components/onboarding/HydrationStep.tsx` and `src/i18n/locales/en.json` + `hi.json`:

- Title (`onboarding.hydrationTitle`): "What's your hydration level today?"
- Subtitle (`onboarding.hydrationSub`): "Tell us how much you drink today and where you'd like to be."
- Keep the existing two inputs and their labels (`currentHydration` = "How much do you drink today?", `hydrationGoal` = "Daily goal") unchanged.

## Out of scope

No changes to the diet step, the allergy free-text "other" field, hydration units, or validation thresholds.
