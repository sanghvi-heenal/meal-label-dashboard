
## Plan: Merge Hydration into Log section as "Log a Drink"

### The idea
Right now the bottom nav has **Dashboard · Log · Hydration · History**. The Log page has a "Drink" pill that overlaps confusingly with the separate Hydration tab. Let's collapse them: **one Log section with two clear modes — Log a Meal and Log a Drink** — and retire the standalone Hydration tab.

### What changes

**1. Bottom nav (`src/components/BottomNav.tsx`)**
- Drop the **Hydration** tab. Back to 4 tabs: Dashboard · Log · History · Settings (Settings comes back to the nav since the slot frees up). 
  - *Or keep Settings in the profile icon if you prefer — say the word.*

**2. Log page becomes a hub (`src/pages/LogMeal.tsx` → rethink as `/log`)**
- Top of page: two big mode cards / segmented control:
  - **🍽 Log a Meal** — current photo + text food flow
  - **💧 Log a Drink** — everything currently on `/hydration`
- Selecting "Log a Drink" reveals (inline, same page — no route change):
  - Hydration ring + "X / Y ml today" summary at top of the drink section
  - Quick-log chips: **+150ml**, **+250ml**, **+500ml** water
  - "Log a custom drink" input (tea, coffee, smoothie…) → uses existing drink analysis flow
  - Today's drinks list

**3. Remove standalone Hydration page**
- Delete `src/pages/Hydration.tsx`.
- Remove `/hydration` route from `src/App.tsx`.
- Anywhere that navigates to `/hydration` (Dashboard profile area, etc.) → re-point to `/log` with drink mode pre-selected via `state: { mode: "drink" }` (already supported).

**4. Remove the drink pie chart / ring from Hydration view**
- The hydration **ring** stays (it's the goal tracker — useful), but per your note we strip the **pie chart of drink breakdown** if one exists. Looking at current `Hydration.tsx`, there's only the ring + legend (Consumed/Remaining/Target) + drinks list — no pie chart. So nothing to delete there beyond moving the whole block into Log.
  - *If you meant remove the ring too, tell me and I'll drop it — leaving just the "X ml / Y ml" number + drinks list.*

**5. Dashboard stays clean**
- No hydration card returns. Dashboard remains meal-focused.

### Files touched
- `src/components/BottomNav.tsx` — swap Hydration tab back to Settings (or leave at 4 with Settings in profile icon — confirm)
- `src/pages/LogMeal.tsx` — add Meal/Drink mode toggle at top, render hydration UI inline when Drink mode is active
- `src/App.tsx` — remove `/hydration` route
- `src/pages/Hydration.tsx` — delete
- `src/pages/Dashboard.tsx` — re-point any hydration links to `/log` with drink state

### Two quick confirms
1. **Settings tab**: bring it back into the bottom nav (Dashboard · Log · History · Settings), or keep it tucked behind the profile icon and have only 3 tabs?
2. **Hydration ring inside Log → Drink**: keep it (recommended — it's the goal tracker), or strip it too and show just a plain "1200 / 2000 ml" number?
