
## Plan: Auto-dismiss toasts after a few seconds

### Problem
`TOAST_REMOVE_DELAY = 1000000` ms in `src/hooks/use-toast.ts` means toasts never auto-close. They only disappear when the user taps the X.

### Fix
1. In `src/hooks/use-toast.ts`:
   - Set `TOAST_REMOVE_DELAY = 400` (time between "dismiss" and DOM removal — for the slide-out animation).
   - In the `toast()` function, schedule an **auto-dismiss** after a default visible duration (e.g. 4000 ms), so toasts disappear on their own.
   - Allow callers to override per-toast via a `duration` option (e.g. `toast({ title: "...", duration: 6000 })`).
   - Raise `TOAST_LIMIT` from 1 → 3 so a quick second action doesn't instantly kill the previous toast.

2. Durations by variant (sensible defaults):
   - `success` / `default`: **3500 ms**
   - `warning`: **5000 ms**
   - `destructive`: **6000 ms** (errors deserve more reading time)
   - Hovering the toast pauses the timer (Radix Toast does this automatically once a `duration` is set on the Root).

3. No UI redesign — keeps the icon + colored border look you just approved.

### Files touched
- `src/hooks/use-toast.ts` — auto-dismiss timer, per-variant defaults, raise limit, support `duration` override

### Out of scope
- Migrating the app to `sonner` (separate cleanup)
- Changing toast visuals
