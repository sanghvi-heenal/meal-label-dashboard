## Changes to `src/pages/SettingsPage.tsx`

### 1. Diet type dropdown — match onboarding options
Replace the 5-option `<select>` (Balanced / Vegetarian (no meat) / Vegan / Keto / Paleo) with the same 8 options used in onboarding step 4:

Vegetarian, Vegan, Non-vegetarian, Eggetarian, Pescatarian, Jain, Keto, No preference.

Use the same `DIET_LABEL` mapping from `Onboarding.tsx` (extract it into a small shared helper, e.g. `src/lib/diet-options.ts`, exporting `DIET_VALUES`, `DIET_LABEL`, and a `dietValueFromStored` helper) so onboarding and settings stay in sync. The `<option value>` becomes the canonical stored label and `<option>` text uses the existing `diets.*.label` i18n keys.

Paleo and "Balanced" go away; a legacy stored `dietType: "Balanced"` falls back to "No preference" in the dropdown (via `dietValueFromStored`).

### 2. Daily Nutrition Targets card — drop diet + BMI rows
In the "Daily Nutrition Targets" section, remove the two summary rows for `settings.dietType` and `settings.bmi` (lines 231–238). Keep the Daily hydration row, its inline editor, and the `targetsHint` footnote. The top profile card still shows age · diet · BMI, so that info isn't lost.

### 3. Rename & confirm the reset action
- Rename the button from "Restart onboarding" to "Recheck your nutritional needs" (new i18n keys `settings.recheckNeeds` + `settings.recheckNeedsHint`, added to both `en.json` and `hi.json`; old `resetOnboarding` / `resetOnboardingHint` keys removed).
- On click, open a confirmation dialog using the existing shadcn `AlertDialog` (`@/components/ui/alert-dialog`) with:
  - Title: "Reset your nutrition targets and diet?"
  - Body: "This clears the diet type, goals, allergies and other preferences you picked during onboarding, and takes you back to the welcome flow. Your logged meals stay saved."
  - Cancel + destructive Confirm buttons.
- Only on confirm run `resetOnboarding()` + `navigate("/onboarding")`. Toast copy stays (rename key to `settings.recheckNeedsToast`).

Hindi strings will be translations of the above.

## Out of scope
- No changes to what `resetOnboarding()` actually clears (still just flips `onboardedAt` to null so the onboarding flow re-runs and overwrites answers). Say the word if you want a hard wipe of goals/allergies/diet immediately on confirm instead.
- No changes to the profile edit card, allergies card, hydration editor, or onboarding itself.
