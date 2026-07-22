import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import Index from "./pages/Index";
import LogMeal from "./pages/LogMeal";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import About from "./pages/About";
import Onboarding from "./pages/Onboarding";
import Suggestions from "./pages/Suggestions";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import OAuthConsent from "./pages/OAuthConsent";
import { getProfile } from "@/lib/nutrition-store";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { getAuthStorageKey, restoreSessionForCurrentTab } from "@/lib/auth-persistence";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { session, loading, refreshSession, profileReady, profileVersion } = useAuth();
  const [graceElapsed, setGraceElapsed] = useState(false);
  const [recovered, setRecovered] = useState<boolean | null>(null);

  // Grace window: when auth finished loading but there's no session,
  // give the token a moment to arrive (e.g. from the top-level OAuth tab
  // writing to same-origin storage) before redirecting to /auth. Also
  // re-check on storage / visibility events during the window.
  useEffect(() => {
    if (loading || session) {
      setGraceElapsed(false);
      setRecovered(null);
      return;
    }
    let cancelled = false;
    const authKey = getAuthStorageKey();
    const check = async () => {
      restoreSessionForCurrentTab();
      const existing = await refreshSession();
      if (!cancelled && existing) setRecovered(true);
    };
    const onStorage = (e: StorageEvent) => {
      if (!authKey || e.key === authKey || e.key === null) void check();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    const poll = window.setInterval(check, 300);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setTimeout(() => {
      if (!cancelled) setGraceElapsed(true);
    }, 1500);
    void check();
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loading, session, refreshSession]);

  if (loading || (!session && !graceElapsed && recovered !== false) || (session && !profileReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  // profileVersion in the deps of the parent effect chain isn't needed —
  // we just read the cache here, which was refreshed before profileReady flipped true.
  void profileVersion;
  const onboarded = Boolean(getProfile().onboardedAt);
  if (!onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BackgroundBlobs />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/homepage" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/log" element={<RequireAuth><LogMeal /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
            <Route path="/suggestions" element={<RequireAuth><Suggestions /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/about" element={<RequireAuth><About /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
