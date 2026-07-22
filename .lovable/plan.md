# Conversational meal logging with clarify + multi-add

Make meal logging a short conversation instead of a one-shot analyze-and-save. When the model isn't sure what's on the plate, it asks. When the user is still adding to the same meal (e.g. mid-lunch, or dessert arrives later), we accumulate into one cumulative meal instead of creating multiple entries.

## UX flow on `/log`

Camera or Describe still enter the flow the same way, but the result panel becomes a lightweight chat:

```text
[photo thumbnail]
AI: I see rice, dal, and something green. Is the green a sabzi or a salad?
    Portion looks like ~1 plate — sound right?
    [ Sabzi ] [ Salad ] [ Type answer… ]

You: bhindi sabzi, 1 katori

AI: Got it. Estimated 520 kcal · 18g protein · 78g carbs · 12g fat.
    Is this the whole meal, or adding more?
    [ Done, save meal ]  [ Add another item / photo ]
```

- "Add another item / photo" opens the camera or the describe box again; the new item is analyzed and **added to a running cumulative meal** (name becomes "Rice, dal, bhindi sabzi + curd"; nutrients sum).
- Clarifying questions are asked only when the model's confidence is low OR it flagged unknown items. Confident meals skip straight to the "Done / Add more" step.
- If the user forgot to photograph an addition, the "Add another item" path accepts a text/voice description and confirms the estimated numbers back in chat before summing.
- Meal-type chip (breakfast / lunch / dinner / snack) is auto-suggested from time of day and shown at the top of the chat; user can change it before saving.
- One tap "Done, save meal" writes a single `MealEntry` with the cumulative totals.

## Where clarify is triggered

- Model returns `confidence < 0.7`, OR
- Model returns `needsClarification: true` with a `questions[]` array (e.g. "Is the green sabzi or salad?"), OR
- `quantitySpecified === false` and the item is a main dish (portion question).

If none of these fire, we skip straight to the confirm step (no unnecessary friction).

## Backend changes

Extend `supabase/functions/analyze-food/index.ts` and `analyze-food-text/index.ts`:
- Add two fields to the `extract_nutrition` tool schema:
  - `needsClarification: boolean`
  - `questions: string[]` (0–3 short questions, each with 2–4 suggested chip answers via a parallel `questionChoices: string[][]`)
- System prompt: "If any visible item is ambiguous (unknown dish, unclear ingredient, unclear portion), set `needsClarification: true` and ask specific questions. Otherwise leave it false."
- Keep nutrition estimates in the same call — the user's answers get folded in on a follow-up call.

New Edge Function `refine-meal`:
- Input: `{ previousName, previousTotals, userAnswers: string, imageBase64? }`
- Uses the same gateway/model to re-estimate with the added context and return updated nutrition.

New Edge Function `merge-meal-items` (or reuse `refine-meal` with a mode flag):
- Input: `{ items: [{ name, calories, protein, ... }] }`
- Returns `{ name, calories, protein, ... }` — a combined name plus summed nutrients. Summing can happen client-side; only the combined *name* needs the AI call, and even that can be done client-side with a simple join, so this function is optional. Default: client-side sum + `items.map(i => i.name).join(", ")`.

## Client changes

- New component `src/components/meal/MealChat.tsx` — the chat panel (message list, chip answers, text input, mic).
- New hook / state module `src/lib/meal-session.ts` — holds the `MealSession`:
  ```ts
  type MealItem = { id; name; calories; protein; carbs; fat; fiber; sodium; sugar; satFat; source: "photo"|"text"|"voice" };
  type MealSession = { mealType; items: MealItem[]; messages: ChatMessage[]; pendingQuestions?: string[] };
  ```
- `LogMeal.tsx`: after a photo or description, mount `MealChat` with the initial AI turn; the existing single-shot "save" button becomes "Done, save meal" inside the chat.
- Cumulative totals shown live at the top of the chat as a compact bar (kcal · P/C/F).
- "Add another item" branches back to the camera/describe entry inside the same session (session persists in component state; also cached in `sessionStorage` under `nl:activeMealSession` so a mid-flow reload doesn't lose it).
- On save: sum totals across `items`, build a combined `name`, call `saveMeal` once — no schema changes in the DB.

## Guardrails

- Cap items per session at 8 (prevents unbounded loops).
- Cap clarify rounds at 2 (after two rounds, we accept the estimate and let the user edit manually if needed).
- Every AI call surfaces 429/402 the same way existing edge functions do; chat shows an inline error bubble with a "Retry" button.
- The verdict card (`VerdictCard`) is shown once, after "Done", using the cumulative totals.

## Files

- Edit: `supabase/functions/analyze-food/index.ts` (add `needsClarification`, `questions`, `questionChoices`)
- Edit: `supabase/functions/analyze-food-text/index.ts` (same fields)
- New: `supabase/functions/refine-meal/index.ts` (re-estimate with user answers)
- New: `src/lib/meal-session.ts` (session type + sessionStorage helpers + cumulative totals)
- New: `src/components/meal/MealChat.tsx` (chat UI: bubbles, chip answers, text/mic input, "Add more / Done")
- Edit: `src/pages/LogMeal.tsx` (route photo/describe results into `MealChat`; remove the standalone save button when chat is active)
- Edit: `src/i18n/locales/en.json` + `hi.json` (chat strings: "Is this it?", "Add another item", "Done, save meal", "I'm not sure about…", errors)

## Out of scope

- No DB schema changes (still one `MealEntry` per saved meal).
- No changes to History, Dashboard, or Suggestions.
- No new provider/model — reuses `google/gemini-2.5-flash` via existing Lovable AI Gateway wiring.
- No persistent multi-day "open meal"; the session lives until saved or discarded, and clears on save.
