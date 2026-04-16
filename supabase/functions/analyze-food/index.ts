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

    const systemPrompt = `You are a nutrition label reader. Given an image of food or a nutritional label, extract the following information and return it as a JSON object using the tool provided.

Rules:
- If you can see a nutritional facts label, read the exact values from it.
- If it's a photo of food without a label, estimate the nutritional values based on what you see.
- For the food name, use a short descriptive name (e.g. "Granola Bar", "Grilled Chicken Breast").
- All numeric values should be numbers, not strings.
- If you cannot determine a value, use 0.
- Use per-serving values when available.`;

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
                  text: "Read the nutritional information from this image. Extract the food name, calories, protein, carbs, fat, fiber, sodium, sugar, and saturated fat values.",
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
                  "Extract nutritional information from a food image or label",
                parameters: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Name of the food item",
                    },
                    calories: {
                      type: "number",
                      description: "Calories in kcal",
                    },
                    protein: {
                      type: "number",
                      description: "Protein in grams",
                    },
                    carbs: {
                      type: "number",
                      description: "Carbohydrates in grams",
                    },
                    fat: { type: "number", description: "Total fat in grams" },
                    fiber: {
                      type: "number",
                      description: "Dietary fiber in grams",
                    },
                    sodium: {
                      type: "number",
                      description: "Sodium in milligrams",
                    },
                    sugar: { type: "number", description: "Sugar in grams" },
                    satFat: {
                      type: "number",
                      description: "Saturated fat in grams",
                    },
                  },
                  required: [
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
