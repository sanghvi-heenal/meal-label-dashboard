
## Plan: Post-log nudge + searchable Ideas page

Two related additions to the Ideas flow:

1. **Toast nudge after logging a meal** — right after a meal is saved, show a friendly toast: *"Nice — meal logged! Tap to see healthier ideas based on what you've eaten."* Tapping it deep-links to `/suggestions`.
2. **Search bar on the Ideas page** — user types a dish (e.g. *"roti and lady's finger"*) and gets back **healthier, protein-boosted versions of that exact dish** as recipe cards, each with a YouTube recipe link. Works independently of what they've logged today.

Yes, this is fully possible — the AI generates the healthier variants, and YouTube Data API v3 finds a real recipe video for each one (same approach as the previously approved "Healthier Swaps" plan).

### 1. Post-log toast nudge

After a successful save in `LogMeal.tsx`, show a sonner toast with an action button:

```text
✓ Meal logged!
Find healthier versions of this on the Ideas page.
                                    [ See ideas → ]
```

- Uses existing `toast()` (sonner) — no new dependency
- "See ideas" button navigates to `/suggestions?focus=<logged-meal-name>` so the Ideas page can pre-fill the search bar with what they just ate
- Shown once per log action (not repeated)
- Dismissible; auto-hides after ~6s

### 2. Search bar on Ideas page

New search section at the top of `Suggestions.tsx`:

```text
┌───────────────────────────────────────────┐
│ Find a healthier version of…              │
│ ┌─────────────────────────────────┐ [Go]  │
│ │ e.g. roti and lady's finger     │       │
│ └─────────────────────────────────┘       │
│                                           │
│ Quick chips: [Logged today: Masala chai]  │
│              [Logged today: Khakhra]      │
└───────────────────────────────────────────┘
```

- Free-text input + Go button (also submits on Enter)
- "Quick chips" = tappable pills of dishes the user logged today, so one tap searches that dish
- If the page is opened with `?focus=<dish>`, the input is pre-filled and search auto-runs
- Results render below using the same **SwapCard** layout from the Healthier Swaps plan: dish name, "why it's healthier" (e.g. *"+18g protein, lower glycemic load"*), macro chips, and a **▶ Watch recipe** button

### How the search works (backend)

New edge function **`search-healthier-recipes`** (separate from `suggest-meals`, single-purpose):

1. **AI step** (Lovable AI, `google/gemini-3-flash-preview`, tool-calling): given the search query + diet type + goals, return 3-5 healthier variations of *that specific dish*. Example for "roti and lady's finger":
   - *Multigrain roti + bhindi-paneer masala* (+18g protein)
   - *Besan-stuffed roti + bhindi do pyaza* (+14g protein, more fiber)
   - *Jowar roti + bhindi-chana sabzi* (low GI, +12g protein)
2. **YouTube step**: for each suggestion, call YouTube Data API v3 `search.list` with `<dishName> recipe`, attach the top result's `{ youtubeId, title, channelTitle, thumbnailUrl }`. If no key configured → return a `youtubeSearchUrl` fallback (`https://www.youtube.com/results?search_query=...`).

Returned shape per result: `{ name, whyHealthier, calories, protein, carbs, fat, fiber, proteinAddedG?, tags[], youtubeId?, youtubeTitle?, channelTitle?, thumbnailUrl?, youtubeSearchUrl? }`.

### Caching

- Search results cached in `localStorage` keyed by **normalized query + diet type** for 24h, so repeating the same search is instant and free
- A small "Refresh" link re-runs the AI + YouTube lookup

### Files

**New:**
- `src/components/suggestions/RecipeSearchBar.tsx` — input + Go button + quick chips of today's logged meals
- `src/components/suggestions/SwapCard.tsx` — recipe card with thumbnail, macros, "▶ Watch recipe" / "Search on YouTube" button (shared with the healthier-swaps work)
- `supabase/functions/search-healthier-recipes/index.ts` — AI + YouTube edge function

**Edited:**
- `src/pages/Suggestions.tsx` — render search bar at the top, results section below it, then existing gap summary + add-on cards
- `src/pages/LogMeal.tsx` — after successful save, show sonner toast with "See ideas →" action that navigates to `/suggestions?focus=<dishName>`
- `src/i18n/locales/en.json` & `hi.json` — keys: `suggestions.searchTitle`, `suggestions.searchPlaceholder`, `suggestions.searchGo`, `suggestions.loggedToday`, `suggestions.watchRecipe`, `suggestions.searchOnYoutube`, `suggestions.healthierBy`, `suggestions.noResults`, `log.toastLoggedTitle`, `log.toastLoggedBody`, `log.toastSeeIdeas`

### What you'll need to provide

A **YouTube Data API v3 key** (free tier: 10,000 units/day — way more than enough). When you approve this plan I'll walk you through getting one from Google Cloud Console (~2 min) and add it as a project secret (`YOUTUBE_API_KEY`). **Without the key the feature still works** — each card just shows a "Search on YouTube" button that opens youtube.com results in a new tab, instead of an inline thumbnail.

### Out of scope (follow-ups)
- Voice search in the Ideas search bar (you have voice transcription already — easy follow-up)
- Saving favorite recipes
- Embedded video player (opens in YouTube tab for now)
- Auto-logging a searched recipe into today's meals
- Filtering by cooking time / cuisine

### Open question
Should the post-log toast appear **every time** a meal is logged, or **only when today's macros look unbalanced** (e.g. low protein after a carb-heavy meal — feels smarter, less spammy)? I'll default to **only when unbalanced** unless you prefer every time.
