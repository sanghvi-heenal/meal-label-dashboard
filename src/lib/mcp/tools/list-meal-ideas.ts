import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_meal_ideas",
  title: "List cached meal ideas",
  description:
    "List the signed-in user's recently cached AI meal suggestions (from the Ideas tab). Optionally filter by meal type and light/heavy weight.",
  inputSchema: {
    mealType: z
      .enum(["breakfast", "lunch", "dinner", "snack"])
      .optional()
      .describe("Filter by meal type."),
    mealWeight: z
      .enum(["light", "heavy"])
      .optional()
      .describe("Filter by meal weight."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ mealType, mealWeight, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("cached_ideas")
      .select("meal_type, meal_weight, diet_type, suggestions, updated_at")
      .eq("user_id", ctx.getUserId())
      .order("updated_at", { ascending: false })
      .limit(limit ?? 10);
    if (mealType) query = query.eq("meal_type", mealType);
    if (mealWeight) query = query.eq("meal_weight", mealWeight);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const rows = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { count: rows.length, rows },
    };
  },
});