## Goal
Stop bouncing an already-signed-in user back to `/auth` on refresh inside the Lovable preview, and add an explicit "Keep me signed in" choice.

## Likely cause
Google OAuth currently breaks out of the preview iframe to the top-level tab (`?startGoogle=1` handoff). The session lands in localStorage of *that* top-level tab's origin. When you come back to the editor, the preview iframe may be a different browser tab / different lovable preview URL, so its localStorage doesn't have the session — `RequireAuth` sees no session and sends you to `/auth`. Even when it is the same origin, there's no cross-tab sync, so the iframe only picks up the session after a hard reload.

## Changes

1. **Cross-tab / cross-context session pickup** (`src/hooks/useAuth.tsx`)
   - Listen for `window` `storage` events on the Supabase auth storage key and call `supabase.auth.getSession()` again when it changes, so the iframe picks up a session written by the top-level OAuth tab without needing a manual refresh.
   - Also re-check session on `visibilitychange` (tab becomes visible again).

2. **Don't flash `/auth` before auth finishes loading** (`src/pages/Auth.tsx`)
   - While `authLoading` is true, render the same spinner `RequireAuth` uses instead of the sign-in card. Prevents the "I'm already signed in but I still see the login screen for a second" feel.
   - If a session already exists on mount, redirect immediately (already partly done — tighten so it runs before the card paints).

3. **"Keep me signed in" control** (`src/pages/Auth.tsx` + small helper)
   - Add a checkbox on the sign-in tab, default **on**.
   - When on: use the current persistent localStorage behavior (no change).
   - When off: after sign-in, switch the Supabase client to session-only storage so closing the tab signs the user out. Implemented by writing a small `setSessionPersistence(remember: boolean)` helper that moves the current session token between `localStorage` and `sessionStorage` and flags future writes. (We can't edit the auto-generated `client.ts`, so we do this by copy/removing the token under the `sb-<ref>-auth-token` key after `signInWithPassword` / OAuth completes.)
   - Persist the user's choice in `localStorage` so it's remembered across visits.

4. **Preview-iframe fallback for OAuth session handoff** (`src/pages/Auth.tsx`)
   - After the top-level tab finishes Google sign-in, if it was launched from the preview iframe (`?startGoogle=1`), post a `postMessage` back to `window.opener` (or set a shared localStorage marker) so the editor's iframe knows to re-read the session and navigate to `/` instead of showing the auth card again.

5. **Localization**
   - Add strings for "Keep me signed in" in `src/i18n/locales/en.json` and `hi.json`.

## Out of scope
- No changes to routing structure, RequireAuth redirect targets, onboarding gate, or MCP/OAuth-consent flow.
- No backend / RLS / edge-function changes.

## Verification
- Sign in with Google in the preview → after the top-level tab lands back, the editor's preview shows the dashboard without needing to reload.
- Refresh the preview at `/` → stays on dashboard, no flash of `/auth`.
- Uncheck "Keep me signed in", close the tab, reopen → lands on `/auth`.
- Leave it checked → session survives refresh and tab close.
