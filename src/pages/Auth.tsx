import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Preserve a same-origin `next` from the query string (used by the OAuth
  // consent route when it sends unauthenticated users here). Fall back to
  // router state, then home.
  const rawNext = new URLSearchParams(location.search).get("next");
  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
  const redirectTo =
    safeNext ?? (location.state as { from?: string } | null)?.from ?? "/";
  const absoluteRedirect = window.location.origin + redirectTo;

  useEffect(() => {
    if (!authLoading && session) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, session, navigate, redirectTo]);

  const startGoogleOAuth = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: absoluteRedirect,
    });
    if (result.error) {
      setSubmitting(false);
      console.error("[Google OAuth] error:", result.error);
      toast({
        title: t("auth.googleFailed"),
        description: String(result.error),
        variant: "destructive",
      });
      return;
    }
    if (result.redirected) return;
  };

  // Auto-resume OAuth at top-level after iframe handoff
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const inIframe = window.top !== window.self;
    if (params.get("startGoogle") === "1" && !inIframe) {
      autoStartedRef.current = true;
      // Clean URL so a refresh doesn't re-trigger
      const url = new URL(window.location.href);
      url.searchParams.delete("startGoogle");
      window.history.replaceState({}, "", url.toString());
      void startGoogleOAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast({ title: t("auth.signInFailed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("auth.signedIn") });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: absoluteRedirect },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: t("auth.signUpFailed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("auth.accountCreated"), description: t("auth.accountCreatedSub") });
  };

  const handleGoogle = async () => {
    // If we're inside the Lovable preview iframe, break out to the top
    // window first — Google OAuth blocks iframes (X-Frame-Options: DENY)
    // and the callback can't reach the iframe context otherwise.
    const inIframe = (() => {
      try {
        return window.top !== window.self;
      } catch {
        return true;
      }
    })();

    if (inIframe) {
      const target = new URL(window.location.href);
      target.searchParams.set("startGoogle", "1");
      try {
        if (window.top) {
          window.top.location.href = target.toString();
          return;
        }
      } catch {
        // cross-origin; fall through to opening a new tab
      }
      const opened = window.open(target.toString(), "_blank", "noopener,noreferrer");
      if (!opened) {
        toast({
          title: t("auth.googleFailed"),
          description:
            "Open the app in a new browser tab (or use the published URL) to sign in with Google. The preview iframe blocks Google's consent screen.",
          variant: "destructive",
        });
      }
      return;
    }

    await startGoogleOAuth();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 space-y-6 backdrop-blur-sm">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">{t("auth.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("auth.subtitle")}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={submitting}
        >
          <svg className="mr-2" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.32z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          {t("auth.continueGoogle")}
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
            <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <EmailPasswordFields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
              <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : t("auth.signIn")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <EmailPasswordFields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
              <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : t("auth.createAccount")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

const EmailPasswordFields = ({
  email,
  setEmail,
  password,
  setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="auth-email">{t("auth.email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-9"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="auth-password">{t("auth.password")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9"
            minLength={6}
            required
          />
        </div>
      </div>
    </>
  );
};

export default Auth;