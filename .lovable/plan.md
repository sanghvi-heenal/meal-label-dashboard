
## Plan: Add a "Reset onboarding" action

The user wants a way to jump back to the onboarding flow from the current state (so they can re-test it from scratch).

### What I'll do
Add a **"Reset onboarding"** button in Settings (destructive style, near the bottom). When tapped:
1. Clears `onboardedAt` from the saved profile in `localStorage` (keeps language so they're not bounced to English).
2. Navigates to `/onboarding`.

The existing `RequireOnboarding` guard in `App.tsx` already redirects unonboarded users to `/onboarding`, so clearing `onboardedAt` is enough — no router changes needed.

### Files touched
- `src/lib/nutrition-store.ts` — add a small `resetOnboarding()` helper that strips `onboardedAt`.
- `src/pages/SettingsPage.tsx` — add the button + handler, with a confirm toast.
- `src/i18n/locales/en.json` & `hi.json` — add `settings.resetOnboarding` label + confirm copy.

### Out of scope
- Not wiping meals/history/profile data — only the onboarding flag. (I can add a separate "Reset all data" button if you want — say the word.)
