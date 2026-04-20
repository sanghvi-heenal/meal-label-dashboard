
## Plan: Add personal-stats, diet-type & hydration steps to onboarding

The user wants the original profile questions (age, height, weight, BMI, diet type) brought back into onboarding, plus new questions for current hydration level and hydration goal. These should slot into the existing 5-step flow.

### New onboarding flow (8 steps)
```text
1. Language          (existing)
2. About you         NEW — age, height (cm), weight (kg) → auto-compute BMI
3. Diet type         NEW — single-select: Vegetarian / Vegan / Non-veg / Eggetarian / Keto / Jain / Pescatarian / No preference
4. Goals             (existing — pick 2-3)
5. Log preferences   (existing)
6. Pain points       (existing)
7. App jobs          (existing)
8. Hydration         NEW — current daily intake + daily goal, with unit selector (ml / L / oz / glasses)
```

### Step details

**Step 2 — About you**
- Three numeric inputs: Age (years), Height (cm), Weight (kg).
- BMI auto-computed live and shown as a read-only chip ("BMI 22.4 — Healthy"). No manual BMI input — it's derived.
- Validation: age 10–100, height 100–230 cm, weight 25–250 kg. Continue disabled until all three are valid.
- Saves to existing `profile.age`, `profile.bmi`. Adds new `profile.heightCm` and `profile.weightKg` fields.

**Step 3 — Diet type**
- Single-select card list (reuses `StepCard` with `multi={false}`).
- Options: Vegetarian 🥗, Vegan 🌱, Non-vegetarian 🍗, Eggetarian 🥚, Pescatarian 🐟, Jain 🙏, Keto 🥑, No preference ✨.
- Saves to existing `profile.dietType` (string).

**Step 8 — Hydration**
- Unit selector at top: ml / L / fl oz / glasses (segmented control). Defaults to ml.
- Two numeric inputs in the chosen unit:
  - "How much do you drink today?" → saved to new `profile.currentHydrationMl` (canonical ml)
  - "Daily goal" → saved to existing `profile.hydrationTarget` (ml)
- Numbers convert to ml on save using existing `mlToUnit` helpers (inverse direction added to store).
- Sensible defaults pre-filled (1500 ml current, 2000 ml goal).

### Data model changes (`src/lib/nutrition-store.ts`)
- Add `heightCm: number` (default 165), `weightKg: number` (default 65), `currentHydrationMl: number` (default 1500) to `UserProfile` & `DEFAULT_PROFILE`.
- Add helper `unitToMl(value, unit)` (inverse of existing `mlToUnit`).
- Add helper `computeBMI(heightCm, weightKg)` and `bmiCategory(bmi)` returning `"Underweight" | "Healthy" | "Overweight" | "Obese"` (translation keys).

### Files touched
**New:**
- `src/components/onboarding/AboutYouStep.tsx` — age/height/weight inputs + BMI chip.
- `src/components/onboarding/HydrationStep.tsx` — unit selector + two number inputs.

**Edited:**
- `src/lib/nutrition-store.ts` — new fields, helpers.
- `src/pages/Onboarding.tsx` — bump `total` to 8, add 3 new step branches, wire validation into `stepValid()`, save new fields in `finish()`.
- `src/i18n/locales/en.json` & `hi.json` — add keys: `onboarding.aboutTitle/Sub`, `onboarding.ageLabel`, `onboarding.heightLabel`, `onboarding.weightLabel`, `onboarding.bmiLabel`, `bmi.underweight/healthy/overweight/obese`, `onboarding.dietTitle/Sub`, `diets.vegetarian/vegan/nonVeg/eggetarian/pescatarian/jain/keto/none`, `onboarding.hydrationTitle/Sub`, `onboarding.currentHydration`, `onboarding.hydrationGoal`, `onboarding.unitLabel`.
- `src/pages/SettingsPage.tsx` — surface the new fields (height, weight, current hydration) in the existing profile section so users can edit them later. *(Small addition — keeps onboarding and settings in sync.)*

### Out of scope
- No changes to dashboard logic, AI prompts, or how `currentHydrationMl` is used (it's a snapshot from onboarding only — daily hydration tracking still comes from logged drinks).
- No imperial height/weight units (cm/kg only) — can add a follow-up if you want ft/in + lb.
- BMI categories are informational only; we're not changing calorie/macro targets based on BMI in this pass.
