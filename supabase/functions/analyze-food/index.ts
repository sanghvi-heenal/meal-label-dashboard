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
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a food recognition and nutrition expert. Given an image, you must:

1. CLASSIFY the image into one of these categories:
   - "nutrition_label" — a nutritional facts panel is clearly visible (for FOOD products only)
   - "packaged_food" — a sealed/packaged food item without a visible nutrition label
   - "open_meal" — an open/plated food item, prepared meal, or raw ingredient
   - "not_food" — NOT a food item (cleaning products, electronics, clothing, etc.), OR a nutrition/ingredient label for non-food items (medicine, supplements, cosmetics)

2. Provide a CONFIDENCE score (0 to 1) for your classification.

3. Based on classification:
   - "nutrition_label": Read exact nutritional values from the label. Set all numeric fields accurately.
   - "open_meal": Estimate nutritional values based on what you see. Set all numeric fields to your best estimate.
   - "packaged_food": Only provide the food name. Set all numeric fields to 0.
   - "not_food": Set name to empty string and all numeric fields to 0. Provide a helpful message explaining what you see.

Rules:
- All numeric values should be numbers, not strings.
- Use per-serving values when available.
- If you cannot determine a value, use 0.
- For packaged_food, identify the product name but do NOT estimate nutrition — the user will scan the label next.
- Supplements, vitamins, and medicines are NOT food — classify as "not_food".`;

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
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
                {
                  type: "text",
                  text: "Classify this image and extract nutritional information if applicable.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_nutrition",
                description:
                  "Classify a food image and extract nutritional information",
                parameters: {
                  type: "object",
                  properties: {
                    foodType: {
                      type: "string",
                      enum: ["open_meal", "packaged_food", "nutrition_label", "not_food"],
                      description: "Classification of the image",
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score from 0 to 1",
                    },
                    message: {
                      type: "string",
                      description: "Optional message for not_food items explaining what was detected",
                    },
                    name: {
                      type: "string",
                      description: "Name of the food item (empty for not_food)",
                    },
                    calories: {
                      type: "number",
                      description: "Calories in kcal (0 for packaged_food and not_food)",
                    },
                    protein: {
                      type: "number",
                      description: "Protein in grams",
                    },
                    carbs: {
                      type: "number",
                      description: "Carbohydrates in grams",
                    },
                    fat: {
                      type: "number",
                      description: "Total fat in grams",
                    },
                    fiber: {
                      type: "number",
                      description: "Dietary fiber in grams",
                    },
                    sodium: {
                      type: "number",
                      description: "Sodium in milligrams",
                    },
                    sugar: {
                      type: "number",
                      description: "Sugar in grams",
                    },
                    satFat: {
                      type: "number",
                      description: "Saturated fat in grams",
                    },
                  },
                  required: [
                    "foodType",
                    "confidence",
                    "name",
                    "calories",
                    "protein",
                    "carbs",
                    "fat",
                    "fiber",
                    "sodium",
                    "sugar",
                    "satFat",
                  ],
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
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
      throw new Error("No nutrition data extracted from image");
    }

    const nutrition = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(nutrition), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
