
## Plan: Add English / Hindi language support across the app

### Approach
Use **react-i18next** (the standard for React i18n) with a small custom store wrapper so language preference persists in `localStorage` alongside other profile settings.

### Setup
1. Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
2. Create `src/i18n/index.ts` — initializes i18next, loads JSON resources, reads saved language from profile.
3. Create translation files:
   - `src/i18n/locales/en.json`
   - `src/i18n/locales/hi.json`
4. Import `./i18n` in `src/main.tsx` so it boots before React renders.

### Translation coverage
Translate every user-facing string in:
- **Onboarding** (`Onboarding.tsx`, `GoalPicker.tsx`, `StepCard.tsx`) — including all goal labels/hints, log prefs, pain points, app-jobs.
- **Dashboard** (`Dashboard.tsx`, `SummaryCard.tsx`, `RiskCard.tsx`) — greeting, "Nothing logged yet", "No red flags today", "Today's calories/hydration", remaining text, etc.
- **LogMeal** (`LogMeal.tsx`, `DrinkDescribeSheet.tsx`, `VerdictCard.tsx`) — tabs (Photo/Voice/Text/Drink), prompts, buttons, verdict copy.
- **History** (`History.tsx`) — headers, empty states.
- **Settings** (`SettingsPage.tsx`) — every label, hint, toast.
- **BottomNav** (`BottomNav.tsx`) — Dashboard / Log / History / Settings labels.
- **NotFound** (`NotFound.tsx`).

Numbers, units (ml, kcal, g), and dynamic AI-generated content (meal verdicts from edge functions) stay as-is for now — only static UI chrome is translated. *(Translating AI output would require passing language to the edge functions; out of scope unless you want it.)*

### Language selection UI

**New step in Onboarding** — insert as **Step 0** (before goals):
- Title: "Choose your language / अपनी भाषा चुनें"
- Two large cards: **English** | **हिन्दी (Hindi)**
- Selecting one immediately switches the rest of onboarding into that language and saves to profile.
- Bumps total steps from 4 → 5.

**Settings page** — add a "Language / भाषा" row at the top (above Profile card):
- Segmented control: English | हिन्दी
- Changing it calls `i18n.changeLanguage()` and persists via `saveProfile({ language })`.

### Data model
Add `language: "en" | "hi"` to `UserProfile` in `src/lib/nutrition-store.ts`. Default `"en"`. Backwards-compatible: existing profiles without it fall back to `"en"`.

### Files touched
**New:**
- `src/i18n/index.ts`
- `src/i18n/locales/en.json`
- `src/i18n/locales/hi.json`
- `src/components/onboarding/LanguagePicker.tsx` (onboarding step 0)

**Edited:**
- `src/main.tsx` — import i18n bootstrap
- `src/lib/nutrition-store.ts` — add `language` field + default
- `src/pages/Onboarding.tsx` — add language step, bump total to 5
- `src/pages/SettingsPage.tsx` — add language toggle row
- `src/pages/Dashboard.tsx`, `src/pages/LogMeal.tsx`, `src/pages/History.tsx`, `src/pages/NotFound.tsx` — replace hardcoded strings with `t("…")`
- `src/components/BottomNav.tsx`, `src/components/dashboard/SummaryCard.tsx`, `src/components/dashboard/RiskCard.tsx`, `src/components/meal/VerdictCard.tsx`, `src/components/DrinkDescribeSheet.tsx`, `src/components/onboarding/GoalPicker.tsx`, `src/components/onboarding/StepCard.tsx` — same

### Out of scope (callouts)
- AI/edge-function responses (meal verdicts, food analysis) stay in English. I can add a follow-up to pass language to those functions if you want fully localized AI output.
- No RTL languages — Hindi is LTR so no layout flips needed.
- Toast messages use the same `t()` keys.

### Open question
Hindi has two common registers — formal Sanskritized ("शुद्ध हिन्दी", e.g. "जलयोजन" for hydration) vs. colloquial Hinglish-leaning ("Hydration / पानी का सेवन"). I'll default to **clear conversational Hindi** with English loanwords kept where they're standard (e.g. "कैलोरी", "प्रोटीन") since this is a casual nutrition app — let me know if you want pure शुद्ध हिन्दी instead.
