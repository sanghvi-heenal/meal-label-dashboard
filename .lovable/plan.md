
## Plan: Restructure Dashboard — empty hero, risk card, then toggleable stats below

### What's wrong now
The toggle (Calories | Hydration) lives inside the SummaryCard *together with* the "Nothing logged yet — let's start your day" copy. That couples a friendly empty-state greeting with a stats UI, which feels muddled — see screenshot.

### New layout (top → bottom)
1. **Greeting header** (unchanged) — "Good evening / Today" + BMI chip + profile button.
2. **Hero card — "Nothing logged yet. Let's start your day."**
   Just headline + sub. No ring, no numbers, no toggle. Pure empty-state copy.
   When the user *has* logged something, the headline naturally updates (via `buildSummary`) to reflect today's intake — still no ring/toggle here.
3. **Risk card** — "No red flags today" (unchanged).
4. **Stats card with Calories | Hydration toggle** — new card lower down. This is where the ring + numbers + remaining live. Toggle stays here. Default = Calories.
5. **See details** accordion (unchanged) — full breakdown.

### Component changes

**`src/components/dashboard/SummaryCard.tsx`** — strip it back down to just headline + sub + sun icon. Remove the toggle, both ring blocks, all numeric props. Props become just `{ headline, sub }`.

**`src/components/dashboard/StatsToggleCard.tsx`** *(new)* — owns the Calories | Hydration toggle and renders the appropriate ring + numbers + remaining text. Self-contained, takes calories/hydration props.

**`src/pages/Dashboard.tsx`** — render order:
```text
SummaryCard (just copy)
RiskCard
StatsToggleCard  ← new, sits between RiskCard and the "See details" button
See details accordion
```

### Files touched
- `src/components/dashboard/SummaryCard.tsx` — slim down, drop toggle/rings/numeric props.
- `src/components/dashboard/StatsToggleCard.tsx` — new file, lifted from current SummaryCard's toggle/ring code.
- `src/pages/Dashboard.tsx` — slimmer SummaryCard call, add StatsToggleCard between RiskCard and the details accordion.

### Out of scope
- No changes to RiskCard, the details accordion, History, LogMeal, Settings, or the data layer.
- Toggle state is component-local (not persisted) — same as current behavior.
