
## Plan: Fix YouTube links being blocked

This is not caused by your app user ID, Google login, or needing to be logged into the same Google account as Lovable. The app requests are working: the Ideas cache request and `suggest-meals` backend function both returned `200`, and your authenticated user session is being used correctly.

The blocking screenshot says:

```text
www.youtube.com refused to connect
ERR_BLOCKED_BY_RESPONSE
```

That means YouTube is being loaded inside the embedded preview frame, and YouTube blocks being displayed in iframes. The fix is to make recipe links open as true external browser navigation, never as iframe navigation.

## What I’ll change

1. **Create a safer external-link helper**
   - Add one reusable helper for opening external URLs.
   - It will try to open YouTube/articles in a real new tab.
   - If the preview blocks popups, it will fall back to top-level navigation instead of loading YouTube inside the app iframe.
   - It will avoid default `<a>` iframe navigation entirely.

2. **Update Ideas cards**
   - Change `IdeaCard` YouTube/article clicks from normal anchors to controlled external buttons.
   - Apply this to:
     - The video thumbnail area
     - “Watch recipe”
     - “Search on YouTube”
     - Article button

3. **Update Search result cards too**
   - `SwapCard` still uses plain `<a target="_blank">`, so healthier-recipe search results can still trigger the same blocked iframe behavior.
   - I’ll update `SwapCard` to use the same safe external opener.

4. **Add user-friendly fallback behavior**
   - If the browser refuses to open the tab, show a small toast telling the user the link was opened in the current tab or can be retried.
   - This prevents the app from silently failing.

5. **Improve YouTube enrichment diagnostics**
   - The backend response shows `hasYoutubeKey: true`, but the returned ideas are still falling back to `youtubeSearchUrl` instead of direct `youtubeWatchUrl`.
   - I’ll add clearer backend logging around YouTube API failures so we can distinguish:
     - API quota exceeded
     - API key invalid/restricted
     - YouTube Data API not enabled
     - No video returned for that query
   - The user experience will still work either way: if a direct video is unavailable, it opens YouTube search externally.

## Expected result

After this fix:
- Clicking “Boiled Moong Sprouts Salad with Paneer” opens YouTube outside the embedded app preview.
- The blocked iframe error should stop happening.
- Both Ideas cards and Search result cards behave consistently.
- Login/user ID will not affect YouTube opening.
