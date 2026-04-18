## Plan: Hydration ring on Dashboard + dedicated Hydration tab in bottom nav + first-time setup

### Part A: Dashboard hydration ring (compact)

**1. Store helpers (`src/lib/nutrition-store.ts`)**

- Add `hydrationTarget: number` to `UserProfile` (default `2000` ml).
- Add `getHydrationFromMeals(meals)` — sums ml from drink entries by parsing volume from the name (regex `/(\d+)\s*ml/i`). Only `mealType === "drink"` counts.

**2. New `HydrationRing` component (`src/components/HydrationRing.tsx`)**

- Clone of `CalorieRing` in info-blue (`hsl(var(--info))`). Same SVG, same size, same percentage label.

**3. Dashboard tweak (`src/pages/Dashboard.tsx`)**

- Insert one new "Today's Hydration" card directly below "Today's Calories", reusing `card-surface` styling and the same internal layout (ring left, big `{ml} / {target} ml` + legend right). No grid changes.

### Part B: Hydration tab in bottom nav (replaces current 4-tab layout)

Currently bottom nav has: Dashboard · Log · History · Settings (4 tabs).

Two reasonable options — I'll go with **Option 1** unless you prefer otherwise:

**Option 1 (default): 5 tabs** — add Hydration as a 5th tab between Log and History. Bottom nav becomes: Dashboard · Log · **Hydration** · History · Settings. Icons stay the same size; spacing recalculates automatically since `BottomNav.tsx` uses `justify-around`.

**Option 2: Replace one tab** — swap Settings into a header gear icon and use the freed slot for Hydration (keeps it at 4). . opiton 2 is preferable so where will settings go? settings are specific to the profile so move them in the profile icon section

**4. Bottom nav update (`src/components/BottomNav.tsx`)**

- Add `{ path: "/hydration", icon: GlassWater, label: "Hydration" }` to the tabs array.

**5. New Hydration page (`src/pages/Hydration.tsx`)**

- Big hydration ring at top (reuses `HydrationRing`).
- Today's drink entries listed (filtered `mealType === "drink"`), each showing name + ml + calories.
- Quick-log row: tap chips for **+250 ml water**, **+500 ml water**, **+1 glass (250 ml)** — instantly saves a water entry without going through LogMeal.
- "Log a drink" button → routes to `/log` with drink mode preselected (passes `state: { mode: "drink" }`).

**6. Routing (`src/App.tsx`)**

- Register `/hydration` route pointing to the new page.

**7. LogMeal accepts pre-selected mode (`src/pages/LogMeal.tsx`)**

- Read `location.state.mode`; if `"drink"`, default the input mode pill to Drink.

### Part C: First-time hydration setup

No auth exists — onboarding triggers on first app open per device.

**8. First-run modal (`src/pages/Dashboard.tsx`)**

- On mount, check localStorage flag `nutrilens-hydration-onboarded`. If absent, show a `Dialog`:
  > **How much do you usually hydrate per day?**
- Inputs: number field + unit dropdown — **Glasses (250 ml)** · **Litres** · **Ounces (fl oz)**.
- Submit converts to ml (`glasses*250`, `litres*1000`, `oz*29.5735`), saves to `profile.hydrationTarget`, sets the flag.
- Skip → keeps default 2000 ml + sets flag.

**9. Settings edit (`src/pages/SettingsPage.tsx`)**

- Add a "Daily hydration target" row in the existing nutrition targets card with the same number+unit picker so the user can change it later.

### Files touched

- `src/lib/nutrition-store.ts`
- `src/components/HydrationRing.tsx` (new)
- `src/components/BottomNav.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Hydration.tsx` (new)
- `src/pages/LogMeal.tsx` (small: read preselected mode)
- `src/pages/SettingsPage.tsx`
- `src/App.tsx` (route registration)

### Out of scope

- No real auth/account system.
- No changes to History, drink edge function, or photo flow.

### One quick confirm

Going with **5 tabs in the bottom nav** (Dashboard · Log · Hydration · History · Settings). Say the word if you'd rather replace Settings with a header gear icon to keep it at 4.