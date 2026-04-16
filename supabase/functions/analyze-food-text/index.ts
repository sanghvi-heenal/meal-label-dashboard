import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string" || !description.trim()) {
      return new Response(JSON.stringify({ error: "No description provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a nutrition expert. Given a text description of a meal, estimate the total nutritional content.

The user may specify quantities using teaspoons, tablespoons, cups, pieces, servings, bowls, plates, handfuls, etc.
Use standard nutritional databases (USDA, etc.) as reference for your estimates.

Rules:
- Always return your best estimate — never return 0 unless the item truly has none of that nutrient.
- Combine all items into a single total if multiple foods are described.
- If the description is not food-related, classify as "not_food".
- Use reasonable default portions when the user doesn't specify a quantity (e.g., "rice" = ~1 cup cooked).
- All numeric values should be numbers, not strings.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Estimate the nutritional content of this meal: "${description}"`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_nutrition",
                description: "Extract estimated nutritional information from a meal description",
                parameters: {
                  type: "object",
                  properties: {
                    foodType: {
                      type: "string",
                      enum: ["open_meal", "not_food"],
                      description: "Whether this is a valid food description or not",
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score from 0 to 1",
                    },
                    message: {
                      type: "string",
                      description: "Optional message for not_food items",
                    },
                    name: {
                      type: "string",
                      description: "A concise name summarizing the meal",
                    },
                    calories: { type: "number", description: "Calories in kcal" },
                    protein: { type: "number", description: "Protein in grams" },
                    carbs: { type: "number", description: "Carbohydrates in grams" },
                    fat: { type: "number", description: "Total fat in grams" },
                    fiber: { type: "number", description: "Dietary fiber in grams" },
                    sodium: { type: "number", description: "Sodium in milligrams" },
                    sugar: { type: "number", description: "Sugar in grams" },
                    satFat: { type: "number", description: "Saturated fat in grams" },
                  },
                  required: ["foodType", "confidence", "name", "calories", "protein", "carbs", "fat", "fiber", "sodium", "sugar", "satFat"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_nutrition" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No nutrition data extracted from description");
    }

    const nutrition = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(nutrition), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
