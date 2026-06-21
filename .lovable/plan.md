## Situation today

Google sign-in code is wired up correctly:
- `src/pages/Auth.tsx` calls `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- `src/integrations/lovable/index.ts` is the auto-generated Lovable Cloud managed OAuth bridge — it redirects to `/~oauth/initiate`, Google authenticates, then comes back to `/~oauth/callback`, which returns tokens that get set via `supabase.auth.setSession`.
- `useAuth` listens on `onAuthStateChange` and would route you to `/` once a session appears.

So the implementation is fine. What is failing is the **environment**, not the code:

1. **You are testing inside the Lovable preview iframe** (`id-preview--…lovable.app` rendered inside the editor). Google's consent screen sets `X-Frame-Options: DENY`, so the OAuth pop / redirect breaks out of the iframe to the top window. After you accept, Google redirects back to `window.location.origin` — but the value of `window.location.origin` was captured **inside the iframe**, so the callback lands in a tab/window the iframe can't observe. The iframe keeps showing `/auth` and "does nothing" — exactly the symptom you describe.
2. A second, related cause: the `redirect_uri` passed in is the preview origin. Even when it lands top-level, the running iframe instance never sees the `setSession` result because that JS ran in a different window context.

This is purely a preview-environment quirk. The same flow normally works on the **published URL** and on **custom domains**, where the page is top-level and the broker callback runs in the same window that started the flow.

## Fix plan

### 1. Make OAuth always run in the top window
Update `handleGoogle` in `src/pages/Auth.tsx` so that, if the app is running inside an iframe, we break out to the top window before starting OAuth. Concretely:

- Detect iframe: `window.top !== window.self`.
- If in iframe: set `window.top.location.href` to the current app URL with `?startGoogle=1` (so the top-level page can auto-trigger the flow), instead of calling `signInWithOAuth` from inside the iframe.
- If top-level: call `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` exactly as today.

### 2. Auto-resume OAuth at top level
On `/auth` mount, if `window.top === window.self` and the URL has `?startGoogle=1`, immediately call `lovable.auth.signInWithOAuth("google", …)`. This makes the iframe → top-level handoff seamless: user clicks once, top window opens, Google runs, returns, session is set, redirect to `/`.

### 3. Better error surfacing
- Log `result.error` to the console verbatim (today we only toast `String(error)`).
- If the popup/redirect is blocked, toast a clear message telling the user to open the **published URL** (or current origin in a fresh tab) to sign in.

### 4. Tell the user where to test
After deploying the fix:
- **Preview iframe**: Google sign-in will now open the app in a new top-level tab and complete there.
- **Published URL** (`Publish` then open the `.lovable.app` URL): Google sign-in works directly.
- **Custom domain**: works directly (managed OAuth supports custom domains).

### 5. What I will NOT change
- No changes to `src/integrations/lovable/index.ts` (auto-generated).
- No changes to `client.ts` / `types.ts`.
- No changes to provider configuration — Google is already the Lovable Cloud managed provider; no client ID/secret setup is needed from you.

## Files touched
- `src/pages/Auth.tsx` — iframe detection, top-level handoff, auto-resume on `?startGoogle=1`, clearer error toast/log.

## Expected result
Clicking **Continue with Google** in the preview opens the app top-level, Google consent completes, you land back on `/` signed in. On the published URL it works in place, no handoff needed.