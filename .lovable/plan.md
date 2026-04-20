
## Plan: "Suggestions" page — smart meal tweaks based on today's logs

A new page that looks at what the user has logged today, finds the gaps (low protein, too many carbs, low fiber, etc.), and suggests **specific recipes** that complement their existing meals — respecting their diet type and goals.

### What it does

Example: user logged *masala chai + khakhra* (high carb, ~5g protein).
The page shows:
- **Gap detected:** "You're 40g short on protein and low on fiber today."
- **Suggested add-ons** (3-5 recipe cards):
  - Moong dal chilla — 14g protein, 180 kcal
  - Steamed idli with sambar — 12g protein, 220 kcal
  - Sprouts chaat — 16g protein, 200 kcal
- Each card: name, why it fits ("adds 14g protein, vegetarian, low-glycemic"), rough macros, and a one-line "how to make" tip.

### How it works

**AI-powered (Lovable AI Gateway, `google/gemini-3-flash-preview`).** A new edge function `suggest-meals` receives today's logged meals + user profile (diet type, goals, remaining macros) and returns 3-5 structured recipe suggestions via tool-calling (guaranteed JSON shape).

We send the AI:
- Today's meals (names + macros)
- Remaining targets (calorie/protein/carbs/fat/fiber gap)
- Diet type (Vegetarian / Vegan / Jain / Keto / etc.) — strict filter
- Goals (e.g. "glucose" → low-GI; "lose_weight" → lower-calorie; "menopause" → bone-friendly)
- Cuisine hint (inferred from logged dish names — keeps suggestions culturally relevant, e.g. Indian if they had khakhra)

Returned shape per suggestion: `{ name, whyItFits, calories, protein, carbs, fat, fiber, quickTip, tags[] }`.

### New route & navigation

- New route: `/suggestions` → `src/pages/Suggestions.tsx`
- Add a 5th item to `BottomNav.tsx`: **Ideas** (lightbulb icon)
- Also add a **"Get meal ideas"** entry-point card on the Dashboard (under the macros section) that deep-links to `/suggestions`

### Page layout (`Suggestions.tsx`)

```text
┌─────────────────────────────────┐
│  Meal ideas for you             │
│  Based on what you ate today    │
├─────────────────────────────────┤
│  [Gap summary card]             │
│  "Low on protein (-40g)         │
│   and fiber (-12g) today."      │
├─────────────────────────────────┤
│  [Refresh ideas] button         │
├─────────────────────────────────┤
│  ┌─[Recipe card]─────────────┐  │
│  │ 🌱 Moong dal chilla       │  │
│  │ Why: +14g protein, vegan  │  │
│  │ 180 kcal · P14 C20 F4     │  │
│  │ Tip: Blend soaked moong…  │  │
│  └───────────────────────────┘  │
│  …(2-4 more cards)              │
└─────────────────────────────────┘
```

Empty-state if nothing logged yet: "Log a meal first and we'll suggest what to add next."

### Files

**New:**
- `src/pages/Suggestions.tsx` — page with loading skeleton, gap summary, recipe cards, refresh button
- `src/components/suggestions/SuggestionCard.tsx` — single recipe card
- `src/components/suggestions/GapSummary.tsx` — small "what you're missing" card
- `supabase/functions/suggest-meals/index.ts` — edge function calling Lovable AI with tool-calling for structured output

**Edited:**
- `src/App.tsx` — add `/suggestions` route (guarded by `RequireOnboarding`)
- `src/components/BottomNav.tsx` — add 5th nav item "Ideas"
- `src/pages/Dashboard.tsx` — add a small "Get meal ideas →" entry card
- `src/i18n/locales/en.json` & `hi.json` — `suggestions.*` keys (title, gap copy, empty state, refresh, "why it fits", "quick tip")
- `supabase/config.toml` — register new edge function (verify_jwt = false, since the app currently has no auth)

### Out of scope (can be follow-ups)
- Saving favorite suggestions
- Tapping a suggestion to log it directly (one-tap "Add to today")
- Full recipe pages with step-by-step instructions
- Image generation for each dish

### Open question (only one)
Should suggestions refresh **automatically each time** the user opens the page (always fresh, but uses an AI call each visit), or only when they tap **Refresh ideas** (cached per-day, cheaper)? I'll default to **cache per-day + manual refresh button** unless you prefer always-fresh.
