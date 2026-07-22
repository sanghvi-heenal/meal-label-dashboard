import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  applySessionPersistence,
  clearStoredAuthSession,
  getAuthStorageKey,
  getRememberPreference,
  restoreSessionForCurrentTab,
} from "@/lib/auth-persistence";
import {
  clearProfileCache,
  hydrateProfileFromDb,
  setProfileUserId,
} from "@/lib/nutrition-store";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True once the user's DB profile row has been fetched (or we know there is none). */
  profileReady: boolean;
  /** Bumps whenever the profile row is refreshed from the DB. Consumers can watch this to re-render. */
  profileVersion: number;
  refreshSession: () => Promise<Session | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  const refreshSession = useCallback(async () => {
    restoreSessionForCurrentTab();
    const { data: { session: existing } } = await supabase.auth.getSession();
    setSession(existing);
    setLoading(false);
    applySessionPersistence(getRememberPreference());
    return existing;
  }, []);

  // Whenever the signed-in user changes, hydrate the profile from Supabase
  // so RequireAuth can decide onboarding correctly without going through
  // localStorage-only state.
  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (!uid) {
      setProfileUserId(null);
      setProfileReady(false);
      return;
    }
    setProfileReady(false);
    let cancelled = false;
    void hydrateProfileFromDb(uid).finally(() => {
      if (cancelled) return;
      setProfileReady(true);
      setProfileVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    restoreSessionForCurrentTab();

    // Set up listener BEFORE getSession to avoid race conditions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "SIGNED_OUT") {
        clearStoredAuthSession();
        clearProfileCache();
      }
      setSession(newSession);
      setLoading(false);
      applySessionPersistence(getRememberPreference());
    });

    void refreshSession();

    // Re-read the session when the auth token changes in another tab
    // (e.g. the top-level tab that completed Google OAuth writes the
    // session; the preview iframe should pick it up without a manual
    // reload) or when this tab becomes visible again.
    const authKey = getAuthStorageKey();
    const refresh = () => { void refreshSession(); };
    const onStorage = (e: StorageEvent) => {
      if (!authKey || e.key === authKey || e.key === null) refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearStoredAuthSession();
    clearProfileCache();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        profileReady,
        profileVersion,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};