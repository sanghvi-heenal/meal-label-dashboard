
## Plan: Remove "Gain muscle" and reorder goals

### Changes
1. **Drop** `gain_muscle` from the goal list entirely.
2. **Reorder** the remaining 7 goals in `src/pages/Onboarding.tsx` (the `goals` array) to:
   1. 🥗 Generally eat healthier (`eat_healthy`)
   2. ⚡ More energy & better mood (`energy_mood`)
   3. ⚖️ Lose weight (`lose_weight`)
   4. 🍚 Gain weight (healthy) (`gain_weight`)
   5. 🩺 Monitor glucose / diabetes (`glucose`)
   6. ❤️ Heart & cholesterol health (`heart`)
   7. 🌸 Menopause support (`menopause`)

### Files touched
- `src/pages/Onboarding.tsx` — remove the `gain_muscle` entry from the `goals` array and reorder the rest.
- `src/lib/nutrition-store.ts` — remove `"gain_muscle"` from the `Goal` union type.
- `src/lib/insights.ts` — remove the `gain_muscle` branch (protein-deficit rule). Other goals keep their existing rules in current order.

### Migration
Anyone who had `gain_muscle` selected from earlier testing: on next profile read, filter it out of `goals[]`. If that empties the array, fall back to `["eat_healthy"]`. Tiny shim added to `getProfile()`.

### Out of scope
- No UI/component changes to `GoalPicker` — it just renders whatever order the array provides.
- No copy changes elsewhere.
