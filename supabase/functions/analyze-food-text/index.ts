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
    const { description, language, mode, presetType } = await req.json();
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

    const systemPrompt = `You are a multilingual nutrition expert with deep knowledge of global cuisines, especially Indian, South Asian, and regional foods (e.g. roti, chapati, dal, sabzi, paratha, idli, dosa, biryani, poha, upma, khichdi, curd rice, etc.).

The user may describe their meal in ANY language — English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, or others. They may also mix languages (e.g. Hinglish: "2 roti aur ek katori dal").

Your task:
1. Understand the description regardless of language or script (Devanagari, Tamil, Bengali, Roman, etc.).
2. Identify each food item and its quantity. Quantities may use local units: katori (~150ml bowl), chamach (spoon), mutthi (handful), thali, plate, glass, tsp, tbsp, cup, piece, etc.
3. Estimate the total nutritional content using standard databases (USDA, IFCT for Indian foods).
4. Return the food name as a faithful, concise English rewording of EXACTLY what the user said (transliterated if needed).

CRITICAL Rules for the "name" field:
- Use ONLY the food items the user explicitly mentioned. Do NOT add, assume, or infer ingredients that were not stated.
- Example: if the user says "avocado with fried egg", the name MUST be "Avocado with Fried Egg" — NEVER "Avocado Toast with Fried Egg" (no toast was mentioned).
- Example: if the user says "dal and rice", the name MUST be "Dal and Rice" — do not add ghee, roti, or anything else.
- Translate non-English descriptions into English, but never invent additional foods.

Quantity detection:
- Set "quantitySpecified" to true ONLY if the user explicitly mentioned a number, count, or measure (e.g. "2 eggs", "1 cup rice", "100g chicken", "1 katori dal", "a slice of bread", "half avocado", "one piece").
- Set "quantitySpecified" to false if the user just listed foods without any quantity (e.g. "avocado with fried egg", "dal and rice", "chicken curry").
- Words like "a", "an", "some" alone do NOT count as quantities. Specific counts like "one", "two", "half" DO count.

Other rules:
- Always return your best estimate for nutrition — never return 0 unless the item truly has none of that nutrient.
- Combine all items into a single nutritional total if multiple foods are described.
- If the description is not food-related, classify as "not_food".
- Use reasonable default portions when no quantity is given (e.g. 1 chapati ~ 30g, 1 katori dal ~ 150ml, 1 avocado ~ 150g, 1 egg ~ 50g).
- All numeric values should be numbers, not strings.

CLARIFICATION LOGIC:
- If any item is ambiguous or unfamiliar, or a portion is genuinely unclear (and not specified by the user), set "needsClarification" to true and populate "questions" (1-3 short questions) with parallel "questionChoices" (2-4 short chip answers per question).
- If the description is clear, set "needsClarification" to false and leave the arrays empty.
- Always return best-estimate nutrition even when asking questions.${mode === "drink" ? `

DRINK MODE: The user is describing a beverage. Always estimate the total volume in milliliters in the "volumeMl" field (a glass ≈ 250ml, mug ≈ 250ml, can ≈ 330ml, bottle ≈ 500ml, katori/small bowl ≈ 150ml). Pay extra attention to sugar content. If volume is not stated, infer a reasonable serving size from the container described.` : ""}${presetType ? `

PRESET CATEGORY: The user indicated this drink is a "${presetType}". Use that as the primary classification and estimate calories accordingly. Reference values:
- black tea / black coffee ≈ 2-5 kcal per cup
- tea/coffee with sugar + milk ≈ 60-120 kcal per cup
- masala chai with whole milk + sugar ≈ 80-120 kcal per 200ml
- cappuccino / latte (whole milk) ≈ 120-180 kcal per 250ml
- smoothie ≈ 150-300 kcal per 300ml depending on ingredients
- fresh juice ≈ 100-160 kcal per 250ml
- whole milk ≈ 150 kcal per 250ml
- soup ≈ 80-200 kcal per 250ml depending on cream/ingredients
- wine ≈ 120 kcal per 150ml; beer ≈ 150 kcal per 330ml
If the user didn't specify additions like sugar/milk/cream, ASK YOURSELF what's typical for this beverage in their described context, but lean toward a moderate estimate.` : ""}`;

    const userPrompt = language && language !== "en-US"
      ? `The user described their meal in ${language}. Estimate the nutritional content of: "${description}"`
      : `Estimate the nutritional content of this meal: "${description}"`;

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
            { role: "user", content: userPrompt },
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
                      description: "A concise name listing exactly the foods the user mentioned, nothing more. Translate to English if needed but NEVER add foods (like 'toast', 'bread', 'rice') that were not explicitly stated by the user.",
                    },
                    quantitySpecified: {
                      type: "boolean",
                      description: "True if the user explicitly stated a quantity/count/measure for the food (e.g. '2 eggs', '1 cup', '100g', '1 katori', 'half'). False if they just named foods without quantities (e.g. 'avocado with egg').",
                    },
                    calories: { type: "number", description: "Calories in kcal" },
                    protein: { type: "number", description: "Protein in grams" },
                    carbs: { type: "number", description: "Carbohydrates in grams" },
                    fat: { type: "number", description: "Total fat in grams" },
                    fiber: { type: "number", description: "Dietary fiber in grams" },
                    sodium: { type: "number", description: "Sodium in milligrams" },
                    sugar: { type: "number", description: "Sugar in grams" },
                    satFat: { type: "number", description: "Saturated fat in grams" },
                    volumeMl: { type: "number", description: "Estimated drink volume in milliliters (only for drink mode; 0 otherwise)." },
                    needsClarification: {
                      type: "boolean",
                      description: "True if any item is ambiguous or portion unclear and you need confirmation from the user.",
                    },
                    questions: {
                      type: "array",
                      items: { type: "string" },
                      description: "0-3 short clarifying questions.",
                    },
                    questionChoices: {
                      type: "array",
                      items: { type: "array", items: { type: "string" } },
                      description: "Parallel to questions: 2-4 short chip answers per question.",
                    },
                  },
                  required: ["foodType", "confidence", "name", "quantitySpecified", "calories", "protein", "carbs", "fat", "fiber", "sodium", "sugar", "satFat"],
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
