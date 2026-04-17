
## Plan: Show clear macro labels + preserve user's exact food name

### Issue 1: Inputs lose context once filled in
Currently the macro grid uses placeholders like "Calories (kcal)", "Protein (g)" — but placeholders **disappear** the moment the AI auto-fills values. The user sees a grid of bare numbers (400, 15, 30, 25, 9, 400, 3, 7) with no idea what each means or its unit.

**Fix in `src/pages/LogMeal.tsx`** — replace the bare `<input>` grid (lines 608–617) with labeled fields. Each cell becomes a small block:

```
┌───────────────────────┐
│ Calories  (kcal)      │   ← persistent label + unit
│ ┌───────────────────┐ │
│ │ 400               │ │
│ └───────────────────┘ │
└───────────────────────┘
```

Labels and units to show above each input:
- Calories — kcal
- Protein — g
- Carbs — g
- Fat — g
- Fiber — g
- Sodium — mg
- Sugar — g
- Sat. Fat — g

Also add the same treatment to the food-name input (label "Food name" above it) for consistency.

### Issue 2: AI is adding words the user never said
User said *"avocado with fried egg"* → AI returned *"Avocado Toast with Fried Egg"*. It invented "toast".

**Fix in `supabase/functions/analyze-food-text/index.ts`** — tighten the system prompt so the `name` field is built strictly from items the user mentioned:

Add explicit rules:
- "Use ONLY the food items the user explicitly mentioned. Do NOT add, assume, or infer ingredients that were not stated (e.g., if the user says 'avocado with egg', do NOT add 'toast' or 'bread')."
- "The `name` field should be a faithful, concise rewording of what the user said — translated/transliterated to English if needed — without adding new foods."
- Update the `name` parameter description to: *"A concise name listing exactly the foods the user mentioned, nothing more. Translate to English if needed but never add foods that were not explicitly stated."*

Nutrition estimation can still assume reasonable default portions (1 avocado, 1 egg) — that part stays. We're only constraining the **name** and the **list of items**, not the math.

### Out of scope
- No changes to the photo-analysis edge function (different flow).
- No changes to voice/listening logic.
- No new dependencies.
