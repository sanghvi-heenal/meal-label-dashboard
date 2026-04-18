
## Plan: Richer background visuals + more color across the app

Goal: take the flat dark slate look and add depth, color, and atmosphere — without breaking the current dark theme or readability.

### 1. Animated gradient background blobs (global)

Add decorative blurred blobs behind everything, visible on every page:
- **Top-right blob** — warning/orange-tinted (`bg-warning/20`), `blur-3xl`, ~400px
- **Bottom-left blob** — info/blue-tinted (`bg-info/20`), `blur-3xl`, ~400px
- **Center-mid blob** — primary/green-tinted (`bg-primary/15`), `blur-3xl`, ~300px
- All with a slow `animate-blob-float` keyframe (gentle 12-15s ease-in-out drift) so the background subtly breathes.
- Implemented as a fixed-position layer in `src/App.tsx` (or a new `BackgroundBlobs` component) sitting behind page content with `z-[-1]` and `pointer-events-none`.

### 2. Subtle noise/grain overlay (optional polish)

Fixed pointer-events-none div with a CSS noise pattern at ~3% opacity for premium texture (think Linear, Vercel sites).

### 3. Per-card gradient surfaces

Upgrade the flat `card-surface` utility:
- Add a faint diagonal gradient (`bg-gradient-to-br from-card to-card/60`) so cards feel layered, not flat.
- Add a 1px gradient border accent (top edge brighter) for depth.

### 4. Section-specific color tints

- **Calories card**: subtle warning/amber inner glow (`shadow-[inset_0_1px_40px_rgba(245,158,11,0.08)]`).
- **Drinks card**: subtle info/cyan inner glow.
- **Macros card**: faint primary/green inner glow.
- Each card gets a tiny colored top-border (1px gradient) matching its theme.

### 5. Gradient text on hero numbers

The big calorie/ml numbers on Dashboard get gradient text:
- Calories: `from-warning to-warning/50 bg-clip-text text-transparent`
- Hydration: `from-info to-info/50`
- Makes the focal numbers pop dramatically.

### 6. Color-tinted page entry

Add a one-time radial gradient flash on page mount (very subtle, ~0.6s fade) — like a soft "wake up" pulse from the active section's color.

### Files touched

- `src/index.css` — add `card-surface` gradient upgrade, noise utility, blob keyframes (`blob-float`)
- `tailwind.config.ts` — register `blob-float` animation
- `src/App.tsx` — mount global `<BackgroundBlobs />` layer
- `src/components/BackgroundBlobs.tsx` (new) — the 3 animated blobs
- `src/pages/Dashboard.tsx` — gradient text on big numbers, colored card tints/glows

### Out of scope (ask if you want these too)

- Full theme swap (Neon Health / Sunrise Warm directions)
- Light mode
- Per-page custom backgrounds
- Animated mesh gradient (heavier, can do as v2)

Pick: **ship all 6**, or tell me which to drop (e.g., "skip noise" or "no gradient text").
