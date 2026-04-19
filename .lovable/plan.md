
## Plan: Simplify Dashboard back to calories + hydration with toggle

### Current state
Dashboard shows: greeting → SummaryCard → RiskCard → ProgressRow (goal progress bars) → NextActionCard → recent meals.

### New state
Dashboard shows: greeting → SummaryCard (with calories/hydration toggle) → RiskCard → recent meals.

Remove: `ProgressRow` and `NextActionCard` from the dashboard render.

### Calories ↔ Hydration toggle
`SummaryCard` currently shows calories ring + macro bars. Add a small segmented toggle at the top of the card with two options: **Calories** | **Hydration**.
- Calories view (default): existing CalorieRing + MacroBar (unchanged).
- Hydration view: HydrationRing component + a short label ("X / Y ml today"). HydrationRing already exists in the codebase.

Toggle state lives in `Dashboard.tsx` (or `SummaryCard` — leaning toward `SummaryCard` to keep Dashboard clean, passing hydration data in as props).

### Empty state
First-time users (no meals logged today) already see "Nothing logged yet" copy in SummaryCard and "No red flags today" in RiskCard — both stay as-is. Just confirming these survive.

### Files touched
- `src/pages/Dashboard.tsx` — remove `ProgressRow` and `NextActionCard` imports + render. Pass hydration totals to `SummaryCard`.
- `src/components/dashboard/SummaryCard.tsx` — add internal toggle (Calories | Hydration), accept hydration props, render HydrationRing when toggled.

### Files NOT deleted (kept on disk for now, just unused)
- `src/components/dashboard/ProgressRow.tsx`
- `src/components/dashboard/NextActionCard.tsx`

Easy to restore if you change your mind. I can delete them in a follow-up if you want a clean tree.

### Out of scope
- No changes to RiskCard, History, LogMeal, Settings.
- No changes to nutrition-store data shape.
