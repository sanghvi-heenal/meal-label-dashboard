Plan: Update the displayed application name to "Nutrition Lens" wherever it currently appears as "NutriLens" in user-facing copy.

### Changes
1. **Auth screen** (`src/i18n/locales/en.json` and `src/i18n/locales/hi.json`):
   - "Welcome to NutriLens" → "Welcome to Nutrition Lens".
   - "About NutriLens" / "NutriLens helps you..." → "About Nutrition Lens" / "Nutrition Lens helps you...".

2. **OAuth consent screen** (`src/pages/OAuthConsent.tsx`):
   - "Connect {clientName} to NutriLens" → "Connect {clientName} to Nutrition Lens".
   - Update surrounding explanatory copy references to NutriLens.

3. **MCP server metadata** (`src/lib/mcp/index.ts`):
   - `title` → "Nutrition Lens".
   - Description string references to "NutriLens" → "Nutrition Lens".

### What will not change
- Internal localStorage keys (`nutrilens-profile`, `nutrilens-meals`, etc.) and the MCP server internal name (`nutrilens-mcp`) stay as-is to avoid breaking existing stored data.
- The Lovable project name itself cannot be changed via code; that is done through the project UI (Settings → Rename project). I will point that out so you can update it there.

### Verification
- Re-run the string search to confirm no user-facing "NutriLens" remains except internal identifiers.
- Check the Auth page in the preview to confirm the welcome title reads "Welcome to Nutrition Lens".