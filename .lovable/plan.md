

## Plan: Treat Supplements & Vitamins as Valid Nutritional Items

### What changes

Currently, the AI prompt explicitly classifies supplements, vitamins, and medicines as `"not_food"`, rejecting them. The user wants these items to be accepted and their nutritional content added to daily intake.

### Change: Edge Function prompt update (`supabase/functions/analyze-food/index.ts`)

Two lines need updating in the system prompt:

1. **Line 34** — Remove supplements from the `not_food` category:
   - From: `"not_food" — NOT a food item (cleaning products, electronics, clothing, etc.), OR a nutrition/ingredient label for non-food items (medicine, supplements, cosmetics)`
   - To: `"not_food" — NOT a food item (cleaning products, electronics, clothing, etc.), OR a nutrition/ingredient label for non-food items (cosmetics, household chemicals)`

2. **Line 49** — Replace the supplements exclusion rule:
   - From: `Supplements, vitamins, and medicines are NOT food — classify as "not_food".`
   - To: `Supplements, vitamins, and protein powders with visible nutrition labels should be classified as "nutrition_label" and their values extracted. Only non-ingestible products (cosmetics, cleaning supplies, electronics) should be "not_food".`

This means:
- A bottle of vitamins with a supplement facts panel → `nutrition_label` → values extracted and added to intake
- A protein powder tub with nutrition info → `nutrition_label` → values extracted
- A packaged supplement without visible label → `packaged_food` → prompt to flip and scan
- Cleaning spray, cosmetics, electronics → `not_food` → rejected

No frontend changes needed — the existing classification flow already handles `nutrition_label` correctly by auto-filling the form.

