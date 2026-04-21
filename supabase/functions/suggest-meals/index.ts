// Edge function: suggest-meals
// Uses Lovable AI Gateway with tool-calling to return structured meal suggestions
// that complement what the user has already logged today, then enriches each
// suggestion with a YouTube video (thumbnail + watch link) and, optionally,
// a recipe article preview (Open Graph metadata) when Google CSE keys are set.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MealSummary {
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface RequestBody {
  meals: MealSummary[];
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  dietType: string;
  goals: string[];
  language?: "en" | "hi";
  allergies?: string[];
  allergiesOther?: string;
  healthGoal?: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack" | "all";
  mealWeight?: "light" | "heavy";
  deficits?: { protein: number; fiber: number; calories: number };
}

const SUGGEST_TOOL = {
  type: "function",
  function: {
    name: "return_suggestions",
    description: "Return 3-5 specific meal/snack suggestions that complement what the user already ate today.",
    parameters: {
      type: "object",
      properties: {
        gapSummary: {
          type: "string",
          description:
            "One short sentence (≤140 chars) describing the main nutritional gap today. E.g. 'Low on protein (-40g) and fiber (-12g) today.' Plain English.",
        },
        suggestions: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Specific dish name, culturally relevant." },
              benefitLine: {
                type: "string",
                description: "≤90 chars. Concrete benefit, e.g. 'Adds 18g protein, fills today's gap.'",
              },
              calories: { type: "number" },
              protein: { type: "number", description: "grams" },
              carbs: { type: "number", description: "grams" },
              fat: { type: "number", description: "grams" },
              fiber: { type: "number", description: "grams" },
              tags: {
                type: "array",
                items: { type: "string" },
                description:
                  "Short tags like 'vegetarian', 'high-protein', 'low-GI', 'heart-friendly'.",
              },
              searchQuery: {
                type: "string",
                description:
                  "Short English-only YouTube search query suitable for finding a recipe video. Always include 'recipe'. E.g. 'keto egg muffins high protein recipe'.",
              },
            },
            required: [
              "name",
              "benefitLine",
              "calories",
              "protein",
              "carbs",
              "fat",
              "fiber",
              "tags",
              "searchQuery",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["gapSummary", "suggestions"],
      additionalProperties: false,
    },
  },
};

interface YoutubeMatch {
  youtubeId?: string;
  youtubeTitle?: string;
  channelTitle?: string;
  youtubeThumbnailUrl?: string;
  youtubeWatchUrl?: string;
  youtubeSearchUrl: string;
}

async function findYoutubeVideo(searchQuery: string, apiKey?: string): Promise<YoutubeMatch> {
  const fallback: YoutubeMatch = {
    youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
  };
  if (!apiKey) {
    console.warn("[youtube] no YOUTUBE_API_KEY configured; using search fallback for:", searchQuery);
    return fallback;
  }
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("safeSearch", "moderate");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("key", apiKey);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const bodyText = await res.text();
      // Try to surface a clear reason: quota / disabled API / invalid key.
      let reason = "unknown";
      try {
        const parsedErr = JSON.parse(bodyText);
        const apiReason = parsedErr?.error?.errors?.[0]?.reason;
        const apiMessage = parsedErr?.error?.message;
        if (apiReason === "quotaExceeded" || apiReason === "dailyLimitExceeded") {
          reason = "quota_exceeded";
        } else if (apiReason === "keyInvalid" || res.status === 400) {
          reason = "invalid_api_key";
        } else if (apiReason === "accessNotConfigured") {
          reason = "youtube_data_api_disabled";
        } else if (res.status === 403) {
          reason = "forbidden_or_restricted_key";
        }
        console.warn(
          `[youtube] search failed status=${res.status} reason=${reason} apiReason=${apiReason} message=${apiMessage} query="${searchQuery}"`,
        );
      } catch {
        console.warn(
          `[youtube] search failed status=${res.status} reason=${reason} body=${bodyText.slice(0, 300)} query="${searchQuery}"`,
        );
      }
      return fallback;
    }
    const data = await res.json();
    const item = data.items?.[0];
    const id = item?.id?.videoId;
    if (!id) {
      console.warn(`[youtube] no video found for query="${searchQuery}" (items=${data.items?.length ?? 0})`);
      return fallback;
    }
    console.log(`[youtube] matched videoId=${id} for query="${searchQuery}"`);
    return {
      youtubeId: id,
      youtubeTitle: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      youtubeThumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      youtubeWatchUrl: `https://www.youtube.com/watch?v=${id}`,
      youtubeSearchUrl: fallback.youtubeSearchUrl,
    };
  } catch (e) {
    console.warn(`[youtube] fetch threw for query="${searchQuery}":`, e);
    return fallback;
  }
}

interface ArticleMatch {
  articleUrl?: string;
  articleTitle?: string;
  articleImage?: string;
  articleDescription?: string;
}

function extractMeta(html: string, property: string): string | undefined {
  // Match <meta property="og:xxx" content="..."> or name="..."
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
  return undefined;
}

async function findArticle(
  searchQuery: string,
  apiKey?: string,
  cseId?: string,
): Promise<ArticleMatch | null> {
  if (!apiKey || !cseId) return null;
  try {
    const cseUrl = new URL("https://www.googleapis.com/customsearch/v1");
    cseUrl.searchParams.set("key", apiKey);
    cseUrl.searchParams.set("cx", cseId);
    cseUrl.searchParams.set(
      "q",
      `${searchQuery} recipe site:healthline.com OR site:eatingwell.com OR site:bbcgoodfood.com OR site:bonappetit.com`,
    );
    cseUrl.searchParams.set("num", "1");
    const cseRes = await fetch(cseUrl.toString());
    if (!cseRes.ok) {
      console.warn("Google CSE failed", cseRes.status, await cseRes.text());
      return null;
    }
    const cseData = await cseRes.json();
    const top = cseData.items?.[0];
    const articleUrl: string | undefined = top?.link;
    if (!articleUrl) return null;

    // Fetch the page HTML to extract Open Graph metadata.
    let articleTitle: string | undefined = top.title;
    let articleImage: string | undefined = top.pagemap?.cse_image?.[0]?.src;
    let articleDescription: string | undefined = top.snippet;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const pageRes = await fetch(articleUrl, {
        signal: ctrl.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; NutriLensBot/1.0; +https://nutrilens.app)",
        },
      });
      clearTimeout(timer);
      if (pageRes.ok) {
        const html = (await pageRes.text()).slice(0, 60_000);
        articleTitle = extractMeta(html, "og:title") || articleTitle;
        articleImage = extractMeta(html, "og:image") || articleImage;
        articleDescription = extractMeta(html, "og:description") || articleDescription;
      } else {
        console.warn("Article fetch non-OK", pageRes.status, articleUrl);
      }
    } catch (e) {
      console.warn("Article OG fetch failed, falling back to CSE snippet", e);
    }

    return { articleUrl, articleTitle, articleImage, articleDescription };
  } catch (e) {
    console.warn("findArticle error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const GOOGLE_SEARCH_API_KEY = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const GOOGLE_CSE_ID = Deno.env.get("GOOGLE_CSE_ID");

    const body = (await req.json()) as RequestBody;
    const {
      meals = [],
      remaining,
      dietType,
      goals = [],
      language = "en",
      allergies = [],
      allergiesOther = "",
      healthGoal,
      mealType = "all",
      mealWeight = "light",
      deficits,
    } = body;

    const langInstruction =
      language === "hi"
        ? "Respond in Hindi (Devanagari script) for user-facing text fields (gapSummary, name, benefitLine, tags). Keep numbers as numbers. searchQuery MUST stay in English (it goes to YouTube)."
        : "Respond in English.";

    const mealsText = meals.length
      ? meals
          .map(
            (m) =>
              `- ${m.name} (${m.mealType}): ${m.calories} kcal, P${m.protein} C${m.carbs} F${m.fat} Fib${m.fiber}`,
          )
          .join("\n")
      : "(nothing logged yet)";

    const allergyList = [
      ...allergies,
      ...(allergiesOther ? [allergiesOther] : []),
    ].filter(Boolean);
    const allergyText = allergyList.length
      ? allergyList.join(", ")
      : "none";

    const mealTypeText = mealType === "all" ? "any meal/snack" : mealType;
    const weightText = mealWeight === "heavy" ? "heavier (full meal portion)" : "lighter (snack-sized)";

    const deficitText = deficits
      ? `Protein deficit: ${deficits.protein}g. Fiber deficit: ${deficits.fiber}g. Calorie headroom: ${deficits.calories} kcal.`
      : "";

    const systemPrompt = `You are a nutrition coach suggesting specific dishes that complement what the user already ate today.

STRICT RULES:
1. Respect dietType strictly. Vegetarian = no meat/fish. Vegan = no animal products. Jain = no meat, no root vegetables. Keto = very low carb. Eggetarian = veg + eggs. Pescatarian = veg + fish.
2. NEVER include any allergen the user listed. Treat allergies as hard exclusions (no traces, no substitutions that contain them).
3. Suggestions should fill the biggest macro gap (usually protein, fiber, or remaining calories).
4. Match the requested mealType (${mealTypeText}) and weight (${weightText}). Light = ~150-300 kcal, heavy = ~400-650 kcal.
3. Keep suggestions culturally consistent with what they ate (e.g. if they ate Indian food like khakhra/chai, suggest Indian dishes like moong dal chilla, sprouts chaat, idli).
6. Each suggestion's calories should fit comfortably within the remaining calorie budget.
7. Tailor to goals:
   - "glucose" → low-GI, pair carbs with protein/fiber
   - "lose_weight" → lower calorie, high satiety
   - "gain_weight" → calorie-dense, whole foods
   - "heart" → low sodium, low saturated fat
   - "menopause" → protein, calcium, fiber
   - "energy_mood" → steady carbs + protein
8. Be specific. "Moong dal chilla" not "lentil pancake". "Greek yogurt with chia" not "yogurt".
9. searchQuery: short, English-only, suitable for YouTube search. Always include "recipe" and key descriptors (diet, mealType). Examples: "keto egg muffins high protein snack recipe", "moong dal chilla paneer stuffing recipe".
10. ${langInstruction}`;

    const userPrompt = `Today the user has logged:
${mealsText}

Remaining targets for today:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein} g
- Carbs: ${remaining.carbs} g
- Fat: ${remaining.fat} g
- Fiber: ${remaining.fiber} g

Diet type: ${dietType}
Health goal: ${healthGoal || goals[0] || "general health"}
All goals: ${goals.join(", ") || "general health"}
Allergies (HARD EXCLUSIONS): ${allergyText}
Requested meal type: ${mealTypeText}
Requested meal weight: ${weightText}
${deficitText}

Suggest 3-5 specific dishes that complement what they've eaten, close the biggest gaps, and match the requested meal type + weight.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [SUGGEST_TOOL],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Model did not return suggestions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments) as {
      gapSummary: string;
      suggestions: Array<{
        name: string;
        benefitLine: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        tags: string[];
        searchQuery: string;
      }>;
    };
    const baseSuggestions = parsed.suggestions || [];

    // Enrich each suggestion with YouTube + (optional) article in parallel.
    const enriched = await Promise.all(
      baseSuggestions.map(async (s) => {
        const [yt, article] = await Promise.all([
          findYoutubeVideo(s.searchQuery, YOUTUBE_API_KEY),
          findArticle(s.searchQuery, GOOGLE_SEARCH_API_KEY, GOOGLE_CSE_ID),
        ]);
        return {
          ...s,
          ...yt,
          ...(article ?? {}),
        };
      }),
    );

    return new Response(
      JSON.stringify({
        gapSummary: parsed.gapSummary,
        suggestions: enriched,
        hasYoutubeKey: Boolean(YOUTUBE_API_KEY),
        hasArticleKeys: Boolean(GOOGLE_SEARCH_API_KEY && GOOGLE_CSE_ID),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("suggest-meals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
