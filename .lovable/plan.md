# Persist onboarding & profile in the database

Move the user profile (onboarding answers, targets, hydration prefs, allergies, language) from `localStorage` to the `profiles` table so returning users skip onboarding on any device/browser.

## Database

Extend `public.profiles` with the fields currently stored in `nutrilens-profile`:

- `age`, `height_cm`, `weight_kg` (int)
- `diet_type` (text), `bmi` (numeric)
- `calorie_target`, `protein_target`, `carbs_target`, `fat_target`, `fiber_target`, `sodium_target`, `sugar_target`, `sat_fat_target` (int)
- `hydration_target` (int, ml), `hydration_unit` (text), `current_hydration_ml` (int)
- `reminders_enabled` (bool), `reminder_times` (jsonb)
- `goals` (text[]), `log_prefs` (text[]), `pain_points` (text[]), `app_jobs` (text[])
- `language` (text)
- `allergies` (text[]), `custom_allergies` (text[])
- `onboarded_at` (timestamptz) — presence = onboarding complete

RLS + GRANTs already exist on `profiles`; migration only adds columns. Add `updated_at` trigger if missing.

Meals stay in `localStorage` for this change (out of scope; separate migration later).

## App changes

1. **`src/lib/nutrition-store.ts`** — convert to async, backend-backed:
   - `loadProfile()`, `saveProfile(patch)`, `isOnboarded()` all hit Supabase.
   - Keep a small in-memory cache + optional `localStorage` mirror for instant paint, but treat DB as source of truth.
   - Migration path: on first load after this change, if DB row has `onboarded_at IS NULL` but `localStorage` has a completed profile, upload it once, then clear the local copy.

2. **New `src/hooks/useProfile.tsx`** — React context that:
   - Loads the row for `auth.uid()` on sign-in.
   - Exposes `profile`, `loading`, `updateProfile(patch)`, `resetOnboarding()`.
   - Invalidates on `SIGNED_OUT`.

3. **`RequireAuth` in `src/App.tsx`** — gate on `useProfile().profile?.onboarded_at` instead of the sync `isOnboarded()`, showing the loader while the profile is fetching. This is what fixes the "returning user sent back to onboarding" bug.

4. **Consumers** — update pages/components that call `getProfile`/`saveProfile` synchronously (`Onboarding`, `SettingsPage`, `Dashboard`, `LogMeal`, `Suggestions`, `HydrationRing`, insights helpers, MCP `get-profile` tool) to read from the hook / async helpers. MCP tool already queries `profiles` directly — extend its select to the new columns.

5. **Reset flow** — `resetOnboarding()` sets `onboarded_at = null` in DB (keeps language + prefs), then routes to `/onboarding`.

## Out of scope

- Meal history migration (still `localStorage`).
- Cached AI ideas (already in `cached_ideas` table).

## Risks

Broad refactor: many components read `getProfile()` synchronously today. They'll need to accept an async/loading state or read via the new hook. I'll do this in one pass and verify build + a Playwright sign-in → dashboard smoke.
