// Helpers for the "Keep me signed in" preference.
//
// The Supabase client is created with `storage: localStorage` (see
// src/integrations/supabase/client.ts, which is auto-generated and can't be
// edited). To honor a "don't remember me" choice we move the stored session
// from localStorage into sessionStorage after sign-in, so it disappears when
// the browser tab closes. On next sign-in we mirror the choice again.

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const AUTH_TOKEN_KEY = PROJECT_ID ? `sb-${PROJECT_ID}-auth-token` : null;
const REMEMBER_KEY = "nl.auth.remember";

export function getAuthStorageKey(): string | null {
  return AUTH_TOKEN_KEY;
}

export function getRememberPreference(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_KEY);
    // default: remember
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function setRememberPreference(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Apply the current "remember me" choice to the persisted session.
 * If `remember` is false, move the token from localStorage → sessionStorage.
 * If `remember` is true, ensure it lives in localStorage.
 */
export function applySessionPersistence(remember: boolean): void {
  if (!AUTH_TOKEN_KEY) return;
  try {
    if (remember) {
      const inSession = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (inSession && !localStorage.getItem(AUTH_TOKEN_KEY)) {
        localStorage.setItem(AUTH_TOKEN_KEY, inSession);
      }
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } else {
      const inLocal = localStorage.getItem(AUTH_TOKEN_KEY);
      if (inLocal) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, inLocal);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * The generated auth client reads from localStorage. If a previous
 * "don't remember me" sign-in moved the token into sessionStorage, mirror it
 * back for this tab before `getSession()` runs so refreshes stay signed in.
 */
export function restoreSessionForCurrentTab(): void {
  if (!AUTH_TOKEN_KEY) return;
  try {
    const inSession = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const inLocal = localStorage.getItem(AUTH_TOKEN_KEY);
    if (inSession && !inLocal) {
      localStorage.setItem(AUTH_TOKEN_KEY, inSession);
    }
  } catch {
    /* ignore */
  }
}

export function clearStoredAuthSession(): void {
  if (!AUTH_TOKEN_KEY) return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}