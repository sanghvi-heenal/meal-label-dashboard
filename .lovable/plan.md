
## Plan: Enforce minimum hydration target (1 L equivalent)

### Problem
In Settings → hydration, switching unit from Litres (2 L) to ml keeps the **number** (2) but reinterprets it as 2 ml — a nonsense target. There's no minimum guard.

### Fix
Enforce a hard minimum of **1000 ml** (1 L) on the canonical target, expressed naturally per unit:

| Unit | Minimum input |
|---|---|
| ml | 1000 |
| litres | 1 |
| oz | 34 (≈1000 ml) |
| glasses | 4 (4 × 250 ml = 1000 ml) |

### Changes — `src/pages/SettingsPage.tsx`

1. **`saveHydration()`**: after converting input → ml, if `ml < 1000`, show a destructive toast like *"Minimum hydration target is 1 L (1000 ml / 4 glasses / 34 fl oz)"* and abort save.

2. **Unit dropdown change**: when user switches unit while editor is open, **re-convert** the current ml-equivalent into the new unit instead of leaving the raw number untouched. So 2 L → switch to ml → field shows `2000`, not `2`. This prevents the bug entirely.

3. **Input `min` attribute**: set dynamically per selected unit (`1000` / `1` / `34` / `4`) so mobile number keypads + browser validation help too. Also set `step` sensibly (`50` for ml, `0.1` for litres, `1` for oz/glasses).

4. **Helper text**: small muted line under the input: *"Minimum 1 L (1000 ml / 4 glasses / 34 fl oz)"* so the rule is visible before the user hits save.

### Files touched
- `src/pages/SettingsPage.tsx` — minimum validation, unit-switch reconversion, min/step attrs, helper text

### Out of scope
- Maximum cap (could add ~6 L sanity limit later if needed)
- Changing how hydration shows on Dashboard / History
- Auto-suggesting a target from body weight

<lov-actions>
<lov-suggestion message="Test it on mobile: open Settings → hydration, try entering 2 ml, then switch units back and forth (L ↔ ml ↔ glasses ↔ oz) and confirm the value reconverts correctly and the 1L minimum is enforced.">Verify that it works</lov-suggestion>
<lov-suggestion message="Also add a sensible maximum hydration cap (e.g. 6 L) with a warning toast, since extreme values are likely typos.">Add maximum cap too</lov-suggestion>
<lov-suggestion message="Auto-suggest a hydration target based on the user's body weight (≈35 ml per kg) with a 'Use suggested' button in Settings.">Suggest target from weight</lov-suggestion>
</lov-actions>
