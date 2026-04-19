
## Plan: Replace goal checkboxes with a dropdown picker

### Current
Step 1 of onboarding shows 8 goal cards with checkboxes (multi-select, cap of 3). At 390px width this fills the screen and feels heavy.

### New UX
Replace the checkbox list with a **multi-select dropdown** using the existing shadcn `Popover` + `Command` primitives (same pattern as a combobox):

- Trigger: a single full-width button showing either *"Select your goals…"* or the chosen goals as small chips with × to remove inline.
- Opens a popover with the 8 goal options (emoji + label + hint), tap to toggle, ✓ on selected.
- Soft cap of 3 enforced inside the popover (4th tap is ignored, helper text *"Pick up to 3"* turns amber briefly — same logic that already exists in `Onboarding.tsx`).
- Continue stays disabled until ≥1 goal is selected.

Steps 2, 3, 4 (log prefs, pain points, app jobs) **stay as the current `StepCard` checkbox list** — they're shorter lists where chips work fine and multi-select is the obvious affordance. Only step 1 changes.

### Files touched
- `src/pages/Onboarding.tsx` — replace the `<StepCard>` render for `step === 0` with a new inline dropdown block (chips + Popover/Command). Keep `toggleGoal` and `selectedGoals` state as-is.
- `src/components/onboarding/GoalPicker.tsx` *(new)* — small self-contained component wrapping Popover + Command + chips, props: `options`, `selected`, `onToggle`, `cap`.

No changes to `nutrition-store.ts`, `insights.ts`, or other steps. shadcn `popover`, `command`, and `badge` are already installed.

### Out of scope
- Converting steps 2–4 to dropdowns (they read better as cards).
- Search/filter inside the dropdown (only 8 items — not needed).
