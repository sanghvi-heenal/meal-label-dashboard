

## Plan: Unified Smart Camera with Non-Food Detection

### Overview

Replace the current manual "Scan Label" flow with an automatic smart camera that classifies every photo into one of four categories and guides the user accordingly. Non-food items are rejected with friendly messages at both stages.

### Classification Categories

| Category | Behavior |
|---|---|
| `open_meal` | Estimate nutrition from the photo, auto-fill form |
| `packaged_food` | Show message: "Flip it over and scan the label", offer re-scan button |
| `nutrition_label` | Read exact values from label, auto-fill form |
| `not_food` | Show friendly rejection: "This doesn't look like food. Try again?" |

Each response also includes a `confidence` score (0-1). If below 0.5, prompt the user to take a clearer photo instead of committing to a classification.

### Changes by file

**1. Edge Function (`supabase/functions/analyze-food/index.ts`)**

- Update the AI system prompt to classify images into the 4 categories above
- Add `foodType` (enum string) and `confidence` (number 0-1) as required fields in the tool schema
- For `packaged_food`: return only `name`, `foodType`, `confidence` -- no nutrition values
- For `not_food`: return only `foodType`, `confidence`, and a `message` field (e.g. "This appears to be a cleaning product")
- For `nutrition_label` with non-food content (e.g. medicine, cosmetics): classify as `not_food` with an appropriate message
- For `open_meal` and `nutrition_label`: return full nutrition data plus classification fields

**2. `src/pages/LogMeal.tsx`**

- **Auto-analyze on image capture**: trigger `handleAnalyze` automatically when `imagePreview` is set (via useEffect), removing the manual "Scan Label" button entirely
- **New state**: `detectionState` -- one of `idle | analyzing | packaged | not_food | done`
- **Loading overlay**: show a spinner overlay on the image during analysis
- **Low confidence state**: if `confidence < 0.5`, show: "We're not sure what this is. Try taking a clearer photo." with a Retry button
- **Packaged food prompt**: show a card below the image: "This looks like **{name}**. Flip it over and take a photo of the nutritional label for accurate values." with a "Scan Label" button that re-opens the camera
- **Not-food rejection**: show a card: "This doesn't appear to be a food item. Please try again with a photo of food or a nutritional label." with a Retry button
- **Second scan validation**: when user scans the label after a `packaged` prompt, if the AI returns `not_food` again (e.g. ingredient list instead of nutrition facts), show: "We couldn't find a nutritional label. You can enter values manually."
- Remove the 3-column grid logic for the Scan Label button; keep only Camera and Gallery (2-column)

### User flow

```text
User takes photo
       |
   [Auto-analyze]
       |
   ┌───┴────────────┬──────────────┬──────────────┐
   │                │              │              │
open_meal      packaged_food   nutrition_label  not_food
   │                │              │              │
auto-fill      "Flip & scan    auto-fill       "Not food,
form           the label"      form            try again"
                    │
              [User scans label]
                    │
              ┌─────┴─────┐
              │           │
         nutrition_label  not_food/low confidence
              │           │
         auto-fill     "No label found,
         form          enter manually"
```

### Technical details

Updated tool schema adds these required fields:
- `foodType`: string enum `["open_meal", "packaged_food", "nutrition_label", "not_food"]`
- `confidence`: number (0-1)
- `message`: string (optional, used for not_food explanations)

For `not_food` and `packaged_food`, nutrition fields will be 0 since the AI is instructed to skip estimation for those types.

