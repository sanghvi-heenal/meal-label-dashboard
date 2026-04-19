
The user dropped a sizable feature wishlist. This is a planning task, not a single quick edit. I'll group the work into shippable phases so we don't try to land everything at once (and so each phase is reviewable).

I have enough context from prior conversation about the codebase (Dashboard, LogMeal, SettingsPage, nutrition-store, analyze-food edge functions, local-first storage, no auth). One genuine ambiguity: where onboarding should live (separate route vs first-run modal), since the app is local-first with no auth. I'll propose a sensible default and call it out.

Keeping the plan tight per instructions.

---

## Plan: Goal-first onboarding, meaningful dashboard, educational meal results

Three phases. Approve all three or just phase 1 to start — I'd recommend shipping in order.

### Phase 1 — Goal-first onboarding

**New route**: `/onboarding` (full-screen, 4 steps, swipeable). First visit redirects here from `/`; completion writes to localStorage and to `profile` so it never shows again.

Four questions, all multi-choice (chips/cards, tap to select):

1. **What do you want help with most?** — lose weight · eat better for diabetes/prediabetes · menopause support · general healthy eating
2. **How do you prefer logging?** — photo · voice · typing (multi-select; reorders LogMeal tabs accordingly)
3. **What confuses you most?** — portions · sugar · carbs · protein · drinks (multi-select; drives which "explainers" surface)
4. **What do you want the app to do?** — keep me on track · teach me · warn me about problem meals · help me choose drinks/snacks (multi-select; drives tone of dashboard messages)

**Storage** (extend `profile` in `nutrition-store.ts`):
```ts
goal: 'weight' | 'diabetes' | 'menopause' | 'general'
logPrefs: Array<'photo'|'voice'|'text'>
painPoints: Array<'portions'|'sugar'|'carbs'|'protein'|'drinks'>
appJobs: Array<'track'|'teach'|'warn'|'choose'>
onboardedAt: string
```

**Files**: new `src/pages/Onboarding.tsx`, new `src/components/onboarding/StepCard.tsx`, edits to `App.tsx` (route + redirect guard), `nutrition-store.ts` (new fields + defaults), `LogMeal.tsx` (respect `logPrefs` ordering).

### Phase 2 — Daily Health Dashboard

Replace the current top of `Dashboard.tsx` with 4 meaning-first cards (keeps existing rings/macros below as a "Details" accordion, so we don't lose data for power users).

1. **Today's summary** — single sentence generated from totals + profile. Pure rules engine in a new `src/lib/insights.ts` (no AI call, runs instantly). E.g. *"Good start. Protein is low so far, and hydration is behind."*
2. **Main risk today** — picks the strongest signal: drink calories > 30% of total, sodium > 75% target, sugar spike, very low fiber, etc. One sentence + tiny icon.
3. **Goal progress** — compact row: calories · hydration · protein · fiber · (carb balance if `goal === 'diabetes'`). Mini bars, not full rings.
4. **Next action** — one concrete suggestion tied to time of day + gaps (e.g. *"At lunch, add one protein food and one vegetable."*).

Tone of cards adapts to `appJobs` (warn-leaning vs teach-leaning vs cheerlead).

**Files**: new `src/lib/insights.ts` (pure functions, unit-testable), new `src/components/dashboard/SummaryCard.tsx`, `RiskCard.tsx`, `ProgressRow.tsx`, `NextActionCard.tsx`. Refactor `src/pages/Index.tsx` (or whichever is the dashboard) to use them; existing rings/macros move into a collapsed "See details" section.

### Phase 3 — Educational meal result screen

After AI analysis in `LogMeal.tsx`, show a **verdict card** before the macro numbers:

- **Verdict tag** (one of): balanced · carb-heavy · low-protein · high-sugar drink · salty/processed · good hydration · good fiber. Computed by rules in `insights.ts` from the AI's nutrition output (no extra AI call needed).
- **One-line "why"** under the tag (e.g. *"Sugar from this drink ≈ 6 tsp — most of your day's allowance."*).
- **Tip** tied to the user's `painPoints` (e.g. if "portions" is a pain point and calories are high, suggest a portion adjustment).

Numbers + macro breakdown stay, but rendered below the verdict.

**Files**: `LogMeal.tsx` (render verdict above existing result), reuse `insights.ts`, new `src/components/meal/VerdictCard.tsx`.

### Out of scope for these 3 phases
- Saving onboarding answers to backend (still local-first).
- Re-running onboarding from Settings (easy follow-up).
- Trend insights across days/weeks.
- Push notifications based on risks.

### Open question I'm defaulting on
Onboarding as a **dedicated `/onboarding` route** (cleaner UX, easier to revisit later from Settings) rather than a stacked modal on the dashboard. Say the word if you'd rather have a modal.
