// Edge function: search-healthier-recipes
// Given a free-text dish query (e.g. "roti and lady's finger"), generates 3-5 healthier
// variations via Lovable AI tool-calling, then attaches a YouTube recipe video for each
// (or a youtube.com search URL fallback when YOUTUBE_API_KEY is not configured).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  query: string;
  dietType?: string;
  goals?: string[];
  painPoints?: string[];
  language?: "en" | "hi";
}

interface AiSwap {
  name: string;
  whyHealthier: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  proteinAddedG?: number;
  sugarReductionPct?: number;
  searchQuery: string;
  tags: string[];
}

const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "return_healthier_versions",
    description:
      "Return 3-5 healthier variations of the dish the user searched for, respecting their diet type and goals.",
    parameters: {
      type: "object",
      properties: {
        results: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Specific dish name. Same dish family, healthier twist." },
              whyHealthier: {
                type: "string",
                description: "≤100 chars. Concrete reason: '+18g protein', '−60% sugar (uses dates)', 'lower GI (jowar)'.",
              },
              calories: { type: "number" },
              protein: { type: "number", description: "grams" },
              carbs: { type: "number", description: "grams" },
              fat: { type: "number", description: "grams" },
              fiber: { type: "number", description: "grams" },
              proteinAddedG: {
                type: "number",
                description: "How many grams of protein this swap adds vs the original. Omit if not applicable.",
              },
              sugarReductionPct: {
                type: "number",
                description: "Percentage less sugar vs original (0-100). Omit if not applicable.",
              },
              searchQuery: {
                type: "string",
                description: "Short YouTube search query, e.g. 'multigrain roti paneer bhurji recipe'.",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Short tags like 'vegetarian', 'high-protein', 'low-GI'.",
              },
            },
            required: ["name", "whyHealthier", "calories", "protein", "carbs", "fat", "fiber", "searchQuery", "tags"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
};

interface YoutubeMatch {
  youtubeId?: string;
  youtubeTitle?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  youtubeSearchUrl: string;
}

async function findYoutubeVideo(searchQuery: string, apiKey?: string): Promise<YoutubeMatch> {
  const fallback: YoutubeMatch = {
    youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + " recipe")}`,
  };
  if (!apiKey) return fallback;
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", `${searchQuery} recipe`);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("safeSearch", "moderate");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("key", apiKey);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn("YouTube search failed", res.status, await res.text());
      return fallback;
    }
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return fallback;
    const id = item.id?.videoId;
    if (!id) return fallback;
    const thumb =
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url;
    return {
      youtubeId: id,
      youtubeTitle: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      thumbnailUrl: thumb,
      youtubeSearchUrl: fallback.youtubeSearchUrl,
    };
  } catch (e) {
    console.warn("YouTube fetch error", e);
    return fallback;
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

    const body = (await req.json()) as RequestBody;
    const query = (body.query || "").trim();
    if (!query || query.length > 200) {
      return new Response(JSON.stringify({ error: "Query must be 1-200 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { dietType = "none", goals = [], painPoints = [], language = "en" } = body;

    const langInstruction =
      language === "hi"
        ? "Respond in Hindi (Devanagari script) for all user-facing text fields (name, whyHealthier, tags). Keep numbers as numbers. searchQuery MUST stay in English (it goes to YouTube)."
        : "Respond in English.";

    const systemPrompt = `You are a nutrition coach suggesting healthier versions of a specific dish the user wants to eat.

STRICT RULES:
1. Every result MUST be the SAME dish family as the query (e.g. "roti and lady's finger" → roti + bhindi variations, not unrelated meals).
2. Make each result measurably healthier: more protein, less refined carbs/sugar, more fiber, lower GI, or better fats. State the concrete win in whyHealthier.
3. Respect dietType strictly. Vegetarian = no meat/fish. Vegan = no animal products. Jain = no meat, no root vegetables. Keto = very low carb. Eggetarian = veg + eggs. Pescatarian = veg + fish.
4. Tailor to goals + pain points:
   - "protein" pain or "gain_weight" goal → +protein swaps (paneer, tofu, dal, eggs, chicken, sprouts)
   - "sugar" pain → swap refined sugar for dates/jaggery/honey, smaller portions
   - "carbs" pain or "glucose" goal → multigrain/jowar/bajra/besan flours, low-GI variations
   - "heart" goal → low sodium, low saturated fat, more fiber
5. searchQuery: short, English-only, suitable for YouTube search. Include "recipe".
6. Be specific with names. "Multigrain roti + paneer bhindi masala" not "healthier flatbread".
7. ${langInstruction}`;

    const userPrompt = `User wants healthier versions of: "${query}"

Diet type: ${dietType}
Goals: ${goals.join(", ") || "general health"}
Pain points: ${painPoints.join(", ") || "none"}

Suggest 3-5 healthier variations of this exact dish.`;

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
        tools: [SEARCH_TOOL],
        tool_choice: { type: "function", function: { name: "return_healthier_versions" } },
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
      return new Response(JSON.stringify({ error: "Model did not return results" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments) as { results: AiSwap[] };
    const swaps = parsed.results || [];

    // Attach YouTube info in parallel
    const enriched = await Promise.all(
      swaps.map(async (s) => {
        const yt = await findYoutubeVideo(s.searchQuery, YOUTUBE_API_KEY);
        return { ...s, ...yt };
      }),
    );

    return new Response(
      JSON.stringify({ results: enriched, hasYoutubeKey: Boolean(YOUTUBE_API_KEY) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("search-healthier-recipes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});