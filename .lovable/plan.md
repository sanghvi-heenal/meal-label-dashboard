
## Plan: Expand & restructure the "What do you want help with?" goals

Replace the current 4 hard-coded radio cards in onboarding step 1 with a richer **multi-select** list (people often have more than one goal — e.g. lose weight + eat healthy). Goals drive tone + insights downstream, so the type union and `insights.ts` references need to grow with them.

### New goal set (8 options)

| Value | Label | Emoji |
|---|---|---|
| `lose_weight` | Lose weight | ⚖️ |
| `gain_muscle` | Gain muscle / strength | 💪 |
| `gain_weight` | Gain weight (healthy) | 🍚 |
| `glucose` | Monitor glucose / diabetes | 🩺 |
| `heart` | Heart & cholesterol health | ❤️ |
| `menopause` | Menopause support | 🌸 |
| `energy_mood` | More energy & better mood | ⚡ |
| `eat_healthy` | Generally eat healthier | 🥗 |

(Dropped: `weight` and `general` get renamed to `lose_weight` / `eat_healthy`. `diabetes` → `glucose`. `menopause` kept.)

### UX

- Step 1 becomes **multi-select** (chips, tap to toggle), with a soft cap of 3 ("Pick up to 3 — we'll focus on these").
- Subtitle updated: *"Pick what matters most. You can change this later in Settings."*
- Continue button enabled when ≥1 selected.

### Data model

`src/lib/nutrition-store.ts`:
```ts
export type Goal =
  | "lose_weight" | "gain_muscle" | "gain_weight"
  | "glucose"    | "heart"       | "menopause"
  | "energy_mood"| "eat_healthy";

export interface UserProfile {
  // ...
  goals: Goal[];   // was: goal: Goal
}
```

**Migration**: when reading profile, if old `goal` field exists, map it once → `goals` array (`weight→lose_weight`, `diabetes→glucose`, `general→eat_healthy`, `menopause→menopause`) and drop `goal`. No data loss.

### Insights engine update

`src/lib/insights.ts` currently branches on `profile.goal === 'diabetes'` etc. Switch to `profile.goals.includes(...)` and add light rules for the new goals:

- `gain_muscle` → flag if protein < 60% target by evening; positive nudge when protein on track.
- `gain_weight` → flip "high calories" warning into a positive; surface "you're under target" risk instead.
- `heart` → emphasize sodium + sat fat in risk card.
- `energy_mood` → emphasize hydration gap + sugar spikes (energy dips).
- `glucose` → existing diabetes rules (carb balance, sugar caps).
- `menopause` → existing protein + fiber emphasis.
- `eat_healthy` / `lose_weight` → existing balanced + calorie rules.

Dashboard `ProgressRow` already special-cases diabetes → switch to `goals.includes('glucose')`.

### Files touched
- `src/lib/nutrition-store.ts` — new `Goal` union, `goals: Goal[]`, migration shim in `getProfile()`.
- `src/pages/Onboarding.tsx` — 8-option multi-select, soft cap of 3, updated copy.
- `src/lib/insights.ts` — branch on `goals.includes(...)`, add per-goal rule snippets.
- `src/components/dashboard/ProgressRow.tsx` — replace `goal === 'diabetes'` check with `goals.includes('glucose')`.
- (No changes to `VerdictCard` — it reads pain points, not goals.)

### Out of scope
- A "Re-run onboarding" button in Settings (suggested as follow-up).
- Per-goal custom macro target overrides (e.g. auto-bump protein for `gain_muscle`) — could be a phase 2.
