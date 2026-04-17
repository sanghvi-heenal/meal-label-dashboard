
## Plan: Animated Sound Wave Indicator + Smart Listening Timeouts

### Goal
Replace the static mic icon with an animated sound wave when actively listening, and add intelligent timeout behavior so the mic stops on its own.

### Behavior

| State | Icon | Trigger |
|---|---|---|
| Idle | `Mic` icon | Default |
| Listening | Animated sound wave bars | User taps mic |
| Auto-stop (silence) | Returns to `Mic` | No speech detected for ~3s after start, OR no speech for 3s after a pause |
| Auto-stop (max time) | Returns to `Mic` | 60s total elapsed since start |

Behavior details:
- Hard cap: **60 seconds** total per session.
- Silence cutoff: if no speech is heard for **3 seconds**, stop listening.
- While the user is speaking (or pausing briefly under 3s), keep listening — sound wave stays animated.

### Changes (single file: `src/pages/LogMeal.tsx`)

**1. New `SoundWaveIcon` component (inline)**
- 5 vertical bars styled with Tailwind, each with a staggered `animate-pulse` / custom keyframe to simulate audio waves.
- Sized to match the existing `Mic` icon (h-4 w-4 area).

**2. State + refs**
- Add `silenceTimerRef` (resets on every speech result) → fires at 3s of silence → calls `stopListening`.
- Add `maxTimerRef` → fires at 60s → calls `stopListening`.
- Reuse existing `isListening` state to switch icon.

**3. Speech recognition wiring**
- Set `recognition.continuous = true` and `recognition.interimResults = true` so we get continuous events (it already restarts; we'll switch to continuous mode).
- On every `onresult` event: clear and restart the 3s silence timer.
- On `start`: kick off the 60s max timer + initial 3s silence timer.
- On `stop`/`end`/`error`: clear both timers, reset `isListening` to false.

**4. Button rendering**
- When `isListening`: render `<SoundWaveIcon />` with red tint + pulsing background (existing styling kept).
- When idle: render `<Mic />` as today.
- Remove the now-unused `MicOff` import.

### Tiny CSS addition (`src/index.css`)
- Add a `@keyframes soundwave` animation (scaleY pulse) and a utility class so each bar can have a different `animation-delay` for a natural wave effect.

### Out of scope
- No backend changes.
- No language picker changes.
- No new packages.
