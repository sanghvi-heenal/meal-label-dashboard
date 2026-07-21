## Problem

You keep landing on `/auth` when opening `/suggestions` (or any protected route) inside the Lovable editor preview. `RequireAuth` in `src/App.tsx` redirects to `/auth` whenever `session` is null, and in the preview iframe the session often looks null even after a successful Google sign-in in the top-level tab.

Two things combine to cause this:

1. **Cross-origin storage.** Google OAuth completes on the top-level tab (published URL or `id-preview--*.lovable.app`). If that origin differs from the preview iframe's origin, the session stored in `localStorage` is not readable from the iframe, so `supabase.auth.getSession()` returns null forever there — no amount of `storage` / `visibilitychange` listening will help across origins.
2. **Hard redirect on missing session.** Even in the same-origin case, `RequireAuth` redirects immediately once `loading` flips to `false`. If the session write from the OAuth tab arrives a beat later (or the user opens `/suggestions` in a fresh iframe before the session has been mirrored), we throw them straight back to `/auth`.

## Fix

### 1. Make `RequireAuth` tolerant of a briefly-missing session
- In `src/App.tsx`'s `RequireAuth`, when `session` is null after `loading` is false, do a short retry window (e.g. up to ~1.5s) that calls `supabase.auth.getSession()` again on `storage` / `visibilitychange` / interval before redirecting to `/auth`. Only after that grace window redirect.
- This removes the "flash-to-/auth" race when the session is mid-arrival.

### 2. Detect the cross-origin preview case and guide the user
- In `src/pages/Auth.tsx`, when we're inside an iframe AND `window.top.location.origin` is not readable OR differs from `window.location.origin`, show an inline notice: "You're signed in in the main tab, but the editor preview runs on a different origin and can't see that session. Open the app in a new tab to use it while editing." with a button that opens the current app URL top-level.
- No silent redirect loop; the user gets a clear reason and one-click escape.

### 3. Explicit "I'm signed in — reload preview" affordance
- On `/auth`, if we detect a stale OAuth handoff (`?startGoogle=1` was set earlier, or a session exists in top-level but not here), surface a "Reload preview" button that calls `supabase.auth.getSession()` and then `navigate("/", { replace: true })` if a session appears.

### 4. Keep protected routes reachable by URL
- No route changes. `/suggestions`, `/history`, `/log`, `/settings` all already exist. Once the gate above stops false-negatives, typing `/suggestions` will load it directly.
- (Out of scope unless you want it: adding `/homepage` / `/dashboard` aliases → `/`.)

## Files touched

- `src/App.tsx` — grace-window logic inside `RequireAuth`.
- `src/pages/Auth.tsx` — cross-origin iframe notice + "open in new tab" + optional "reload preview" button.
- (Maybe) `src/hooks/useAuth.tsx` — expose a `refresh()` helper so `RequireAuth` and `Auth` can force a session re-check without duplicating logic.
- `src/i18n/locales/en.json` + `hi.json` — strings for the new notice/buttons.

## Out of scope

- Changing OAuth provider config, redirect URIs, or the Lovable auth broker.
- Migrating meal/hydration logs to Supabase.
- Adding `/homepage` aliases (say the word and I'll add them).

## How you'll verify

1. Open `/suggestions` directly in the preview while signed in → it loads without bouncing to `/auth`.
2. Sign out, open `/suggestions` → sent to `/auth` (expected), sign in, land on `/suggestions`.
3. If the preview iframe origin differs from the top-level origin, `/auth` shows the "open in new tab" notice instead of spinning or looping.
