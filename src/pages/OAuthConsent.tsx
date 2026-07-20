import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Minimal typed wrapper around the beta supabase.auth.oauth namespace.
interface AuthorizationDetails {
  client?: { name?: string; redirect_uri?: string; logo_uri?: string } | null;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
}
interface OAuthApi {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
}
function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-6 space-y-2">
          <h1 className="text-lg font-semibold">Could not load this authorization</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }
  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clientName = details.client?.name ?? "an application";
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Connect {clientName} to NutriLens</h1>
          <p className="text-sm text-muted-foreground">
            {clientName} will be able to call NutriLens tools while you are signed in.
          </p>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Read your basic profile</div>
          <div>• Access your saved meal ideas</div>
          <div>This does not bypass NutriLens permissions or backend policies.</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Cancel connection
          </Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
          </Button>
        </div>
      </Card>
    </div>
  );
}