
## Plan: Add Photo + Voice + Text input to "Other" drinks

### What's there now (Log → Drink tab)
The Drink section in `LogMeal.tsx` likely shows preset chips: Water, Tea, Coffee, Smoothie, Soup, Alcohol, Other. Picking a preset just logs a known item with default volume. "Other" today probably just opens a name field — no picture, no voice.

### What you want
When user picks **Other** (or any non-water beverage where nutrition is unknown), unlock all three input methods so they can describe the drink:
1. **Camera/photo** — snap or upload a picture of the drink (can of juice, glass of lassi, cocktail, energy drink, etc.) → AI estimates volume + nutrition.
2. **Voice** — speak it ("a glass of fresh sugarcane juice with lemon") → AI parses + estimates.
3. **Text** — type a description.

User can use any one OR combine (e.g. take a photo AND add a voice note for context like "this is a 500ml bottle, with extra sugar").

### Approach

**Trigger surface (in `LogMeal.tsx` Drink tab)**
- Keep existing preset chips (Water/Tea/Coffee/Smoothie/Soup/Alcohol).
- Replace the plain "Other" chip with a richer **"Describe a drink"** card that expands inline (or opens a sheet) showing 3 input tiles: 📷 Photo · 🎤 Voice · ⌨️ Text.
- Each tile is independently usable. Selected inputs stack in a small "added inputs" tray above a single **Analyze** button.

**Analysis pipeline**
- **Photo** → reuse existing `analyze-food` edge function (it already handles image → nutrition). It currently classifies as `open_meal` etc. — we'll prompt-tune it to also handle drinks (estimate volume in ml, sugar, caffeine if relevant).
- **Voice** → use Web Speech API (`SpeechRecognition`) in the browser to transcribe → feed transcript into `analyze-food-text` edge function (already exists, multilingual, handles Indian beverages like lassi/chai/nimbu pani).
- **Text** → straight to `analyze-food-text`.
- **Combined inputs** → if user provides both photo + voice/text, send the photo to `analyze-food` and pass the transcript as additional context in a new optional `userContext` field (small edge-function prompt tweak).

**After analysis**
- Show an editable preview card: name, estimated volume (ml), calories, sugar, caffeine (if any), with a confidence badge.
- User confirms → saved as a `drink` MealEntry with the volume embedded in the name (e.g. "Sugarcane juice (300ml)") so existing `getHydrationFromMeals` keeps working.

### Files touched

- `src/pages/LogMeal.tsx` — replace "Other" chip with describe-a-drink expandable section; wire 3 input tiles; show analyze + preview flow
- `src/components/DrinkDescribeSheet.tsx` (new) — the 3-input UI (camera capture, voice recorder using Web Speech API, textarea), input tray, analyze button, editable result preview
- `src/hooks/useVoiceTranscription.ts` (new) — small wrapper around `window.SpeechRecognition` / `webkitSpeechRecognition` with start/stop/transcript state, language auto-detect from browser
- `supabase/functions/analyze-food/index.ts` — extend system prompt to also handle drinks (estimate volume_ml, identify beverage type), accept optional `userContext` string
- `supabase/functions/analyze-food-text/index.ts` — minor: bias toward beverage parsing when called from drink flow (pass a `mode: "drink"` flag)

### UX details

- Camera: uses `<input type="file" accept="image/*" capture="environment">` (same pattern as existing meal photo flow if there is one — I'll check `LogMeal.tsx` during implementation).
- Voice: shows a pulsing red mic button while recording, live transcript below, tap again to stop. Falls back gracefully (hidden on browsers without SpeechRecognition — Safari iOS works, Firefox doesn't).
- All three inputs visible together so user understands they're combinable, not exclusive.
- Single primary "Analyze drink" button at the bottom — disabled until at least one input has content.

### Out of scope
- Saving voice audio files (we only keep the transcript).
- Nutrition database lookup beyond AI estimation.
- Editing presets (Water/Tea/etc.) — those keep their current quick-log behavior.

### Quick confirm before I build
1. **"Other" chip behavior** — replace it with the new describe section, OR keep "Other" as-is for quick-naming and add a separate **"Describe a drink"** button/card alongside the chips? (I lean toward replacing — cleaner.)
2. **Voice language** — auto-detect from browser locale (recommended, supports Hindi/Tamil/etc. for Indian users), or always English?
