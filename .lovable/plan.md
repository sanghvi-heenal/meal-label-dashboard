
## Plan: Remove "AI estimates the rest" hint from Photo option

The user is right — AI runs behind the scenes for all three logging methods (photo, voice, text), so calling it out only on Photo is misleading and implies the other two are "manual."

### Change
In `src/pages/Onboarding.tsx`, update the `logPrefs` array — change the Photo option's `hint` from `"Snap a picture, AI estimates the rest."` to something neutral that just describes the action, e.g. `"Snap a picture of your meal."`.

Voice and Text hints stay as-is (they already just describe the action without mentioning AI).

### Files touched
- `src/pages/Onboarding.tsx` — one-line copy change inside the `logPrefs` array.

### Out of scope
- No component, type, or logic changes.
- Not adding "AI-powered" badging anywhere else (the user's point is that AI is implicit, not something to advertise per-option).
