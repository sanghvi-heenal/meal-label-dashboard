// Edge function: suggest-meals
// Uses Lovable AI Gateway with tool-calling to return structured meal suggestions
// that complement what the user has already logged today.

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
              whyItFits: {
                type: "string",
                description: "≤90 chars. Why this fills the gap given diet + goals.",
              },
              calories: { type: "number" },
              protein: { type: "number", description: "grams" },
              carbs: { type: "number", description: "grams" },
              fat: { type: "number", description: "grams" },
              fiber: { type: "number", description: "grams" },
              quickTip: {
                type: "string",
                description: "One-line how-to-make tip, ≤120 chars.",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description:
                  "Short tags like 'vegetarian', 'high-protein', 'low-GI', 'heart-friendly'.",
              },
            },
            required: [
              "name",
              "whyItFits",
              "calories",
              "protein",
              "carbs",
              "fat",
              "fiber",
              "quickTip",
              "tags",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = (await req.json()) as RequestBody;
    const { meals = [], remaining, dietType, goals = [], language = "en" } = body;

    const langInstruction =
      language === "hi"
        ? "Respond in Hindi (Devanagari script) for all user-facing text fields (gapSummary, name, whyItFits, quickTip, tags). Keep numbers as numbers."
        : "Respond in English.";

    const mealsText = meals.length
      ? meals
          .map(
            (m) =>
              `- ${m.name} (${m.mealType}): ${m.calories} kcal, P${m.protein} C${m.carbs} F${m.fat} Fib${m.fiber}`,
          )
          .join("\n")
      : "(nothing logged yet)";

    const systemPrompt = `You are a nutrition coach suggesting specific dishes that complement what the user already ate today.

STRICT RULES:
1. Respect dietType strictly. Vegetarian = no meat/fish. Vegan = no animal products. Jain = no meat, no root vegetables. Keto = very low carb. Eggetarian = veg + eggs. Pescatarian = veg + fish.
2. Suggestions should fill the biggest macro gap (usually protein, fiber, or remaining calories).
3. Keep suggestions culturally consistent with what they ate (e.g. if they ate Indian food like khakhra/chai, suggest Indian dishes like moong dal chilla, sprouts chaat, idli).
4. Each suggestion's calories should fit comfortably within remaining calorie budget. Prefer 150-400 kcal items.
5. Tailor to goals:
   - "glucose" → low-GI, pair carbs with protein/fiber
   - "lose_weight" → lower calorie, high satiety
   - "gain_weight" → calorie-dense, whole foods
   - "heart" → low sodium, low saturated fat
   - "menopause" → protein, calcium, fiber
   - "energy_mood" → steady carbs + protein
6. Be specific. "Moong dal chilla" not "lentil pancake". "Greek yogurt with chia" not "yogurt".
7. ${langInstruction}`;

    const userPrompt = `Today the user has logged:
${mealsText}

Remaining targets for today:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein} g
- Carbs: ${remaining.carbs} g
- Fat: ${remaining.fat} g
- Fiber: ${remaining.fiber} g

Diet type: ${dietType}
Goals: ${goals.join(", ") || "general health"}

Suggest 3-5 specific dishes that complement what they've eaten and close the biggest gaps.`;

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

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-meals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
