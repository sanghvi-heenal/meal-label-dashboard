
## Plan: Apply page-level motion (#3) + micro-interactions (#4)

### #3 Page-level motion

**Dashboard (`src/pages/Dashboard.tsx`)**
- Wrap top-level sections (header, stats card, macros card, quick stats) in a stagger: each gets `animate-fade-in` with inline `style={{ animationDelay: "Nms" }}` (0ms, 80ms, 160ms, 240ms).
- Calories/Drinks toggle: add a sliding active background. Use a relative container with an absolute pill (`transition-transform duration-300 ease-out`) that translates between left/right based on `statsTab`. Buttons sit on top with transparent bg.

**Bottom nav (`src/components/BottomNav.tsx`)**
- Active tab gets a tiny colored dot (2px) under the icon that fades/scales in.
- Active icon gets a subtle bounce on tap: add `active:scale-90 transition-transform`.
- Optional: a thin top accent line (1px gradient) on the nav bar for lift.

**Macro bars (`src/components/MacroBar.tsx`)**
- On mount, animate width from 0 → `pct` using a `useEffect` + `useState` that sets the width after first paint (existing `transition-all duration-500` already handles the tween).

### #4 Micro-interactions

**Quick-log water buttons (`src/pages/LogMeal.tsx`)**
- On tap of +150/+250/+500: spawn a floating water-drop (💧) absolutely positioned over the button that animates upward + fades out (~700ms) then unmounts. Manage via a transient `flyingDrops` state array with unique ids.
- Add `active:scale-95 transition-transform` to the buttons themselves.
- After logging, briefly pulse the button (e.g., add a `ring-2 ring-info` class for 400ms).

**Meal logging success (`src/pages/LogMeal.tsx`)**
- When a meal is saved (existing save handler), show a centered checkmark that scales-in + fades-out over ~900ms before navigation. Implement with a `showSuccess` boolean overlay using `animate-scale-in`.

**Card hover lift**
- Add `hover-scale` (already in utilities) to the 3 quick-stat tiles in Dashboard's bottom card so they lift on hover/tap.

### New keyframes (`tailwind.config.ts`)

Add:
- `float-up`: `0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-40px) scale(1.3); }` → `animation: "float-up 0.7s ease-out forwards"`
- `count-pop`: subtle scale bounce for the success check (or reuse `scale-in`).

### Files touched
- `tailwind.config.ts` — add `float-up` keyframe + animation
- `src/pages/Dashboard.tsx` — stagger fades, sliding toggle pill, hover-scale on stat tiles
- `src/components/BottomNav.tsx` — active dot indicator, tap scale
- `src/components/MacroBar.tsx` — animated width on mount
- `src/pages/LogMeal.tsx` — floating water-drop on quick-log, success checkmark overlay

### Out of scope
- No color/theme changes (that was #1).
- No ring animations or count-up numbers (that was #2).
- No FAB / decorative blobs (#5–6).
