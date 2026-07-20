import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import getProfile from "./tools/get-profile";
import listMealIdeas from "./tools/list-meal-ideas";

// Build the OAuth issuer from the project ref so the value stays a build-time
// literal (import-safe) and always points at the direct supabase.co host that
// discovery publishes — never the .lovable.cloud proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nutrilens-mcp",
  title: "Nutrition Lens",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in Nutrition Lens user. Use `whoami` to verify the session, `get_profile` to fetch the profile row, and `list_meal_ideas` to browse cached AI meal suggestions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, getProfile, listMealIdeas],
});