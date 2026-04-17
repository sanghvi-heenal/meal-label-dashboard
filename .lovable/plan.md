
## Plan: Add a "Drinks & Hydration" logging flow

### Goal
Today the app only handles solid meals via photo/text. Liquids like water, tea, coffee, smoothies, juices need their own flow because:
- Plain water = 0 kcal but matters for hydration tracking
- Tea/coffee/smoothies have calories that scale linearly with volume
- Volume (ml) is the natural unit, not "1 piece"

### What gets added

**1. New "Drink" pill in LogMeal page**
Top of `src/pages/LogMeal.tsx` currently has Photo / Voice / Text input modes. Add a 4th pill: **Drink** (with a `GlassWater` icon from lucide-react).

**2. Drink logging form (when Drink pill is active)**
Replaces the text/photo area with:

- **Drink type** — quick chips: Water · Tea · Coffee · Smoothie · Juice · Milk · Other
- **Description** — small text field, only shown for non-water (e.g. "masala chai with whole milk and sugar", "mango smoothie with yogurt")
- **Volume** — number input + unit toggle (ml / oz). Quick-pick chips: 100, 200, 250, 330, 500 ml
- **Analyze button** — same look as the existing Analyze button

**3. Hydration handling (water case)**
If type = Water:
- Skip the AI call entirely (no calories to estimate).
- Save directly with calories=0, all macros=0, and `mealType: "drink"`.
- Show a small water-drop confirmation: "+ 250 ml hydration logged".

**4. Caloric drinks (tea/coffee/smoothie/etc.)**
- Call existing `analyze-food-text` edge function with a composed prompt:
  > "<volume> ml of <description or drink type>"
  e.g. "250 ml of masala chai with milk and 1 tsp sugar"
- The edge function already estimates nutrition by quantity, so per-ml scaling works automatically once volume is in the prompt.
- Returned macros populate the same locked grid as today (re-using the existing `isAiFilled` lock + "Clear & re-enter" mechanism).
- The approximate-estimate banner does NOT fire here because volume is always specified.

**5. "Don't know the size?" helper**
Below the volume field, a small link: *"Not sure how much? Pick a typical size →"* opens a tiny popover with reference sizes:
- Small cup (150 ml) · Mug (250 ml) · Tall glass (350 ml) · Bottle (500 ml) · Large bottle (750 ml)
Tap one → fills the volume field.

**6. Storage & display**
- `MealEntry.mealType` in `src/lib/nutrition-store.ts` currently allows `"breakfast" | "lunch" | "dinner" | "snack"`. Extend it with `"drink"`.
- Drinks save with `name` formatted as e.g. "Masala chai (250 ml)" or "Water (250 ml)" so the volume is always visible in History/Dashboard.
- No separate hydration counter on the Dashboard in this round (keeps scope tight) — drinks just appear in the meal list with their calories. Can add a hydration ring later.

### Files touched
- `src/pages/LogMeal.tsx` — add Drink pill, drink form, water shortcut, volume helper popover.
- `src/lib/nutrition-store.ts` — extend `mealType` union to include `"drink"`.

### Out of scope
- No dedicated hydration ring/widget on Dashboard yet (deferred — ask if you want it next).
- No changes to photo flow (drinks via photo would need a separate prompt; not needed now).
- No changes to the edge function (existing prompt already handles "250 ml of …" correctly).

### Tiny question before I build
One choice I'd like you to confirm: should plain **Water** also appear in the meal list on Dashboard/History (as a 0-kcal entry), or should it be silently logged for hydration purposes only and hidden from the meal list?
