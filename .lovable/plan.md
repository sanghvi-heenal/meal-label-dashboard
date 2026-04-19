
Change the soft cap on goal selection from 3 to allow 2–3 picks. Interpreting: minimum 2, maximum 3 selections required to continue.

### Changes
- `src/pages/Onboarding.tsx`:
  - Keep `GOAL_CAP = 3` (max).
  - Add `GOAL_MIN = 2`.
  - Update `stepValid()` for step 0: `selectedGoals.length >= GOAL_MIN`.
  - Pass `min={2}` to `GoalPicker` so the helper text reads "Pick 2–3".
- `src/components/onboarding/GoalPicker.tsx`:
  - Add optional `min` prop (default undefined).
  - Update helper text: when `min` is set, show "Pick {min}–{cap} — we'll focus on these." otherwise current text.

No other files affected.
