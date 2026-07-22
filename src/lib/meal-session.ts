import type { MealEntry } from "@/lib/nutrition-store";

export type MealSessionItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
  source: "photo" | "text" | "voice";
  imagePreview?: string;
};

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
  chips?: string[];
  kind?: "question" | "confirm" | "info" | "error";
};

export type MealSession = {
  mealType: MealEntry["mealType"];
  items: MealSessionItem[];
  messages: ChatMessage[];
  pendingQuestions: string[];
  pendingChoices: string[][];
  // The last analyzed candidate awaiting user's "add to meal" decision after clarify.
  draft?: MealSessionItem;
  // Original input (for re-analyze with clarifications)
  draftInput?: { kind: "photo"; base64: string; userContext?: string } | { kind: "text"; description: string; language?: string };
  clarifyRound: number;
};

const KEY = "nl:activeMealSession";
export const MAX_ITEMS = 8;
export const MAX_CLARIFY_ROUNDS = 2;

export function emptySession(mealType: MealEntry["mealType"] = "lunch"): MealSession {
  return {
    mealType,
    items: [],
    messages: [],
    pendingQuestions: [],
    pendingChoices: [],
    clarifyRound: 0,
  };
}

export function loadSession(): MealSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MealSession;
  } catch {
    return null;
  }
}

export function saveSession(s: MealSession | null) {
  try {
    if (!s) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export function totals(items: MealSessionItem[]) {
  return items.reduce(
    (a, i) => ({
      calories: a.calories + (i.calories || 0),
      protein: a.protein + (i.protein || 0),
      carbs: a.carbs + (i.carbs || 0),
      fat: a.fat + (i.fat || 0),
      fiber: a.fiber + (i.fiber || 0),
      sodium: a.sodium + (i.sodium || 0),
      sugar: a.sugar + (i.sugar || 0),
      satFat: a.satFat + (i.satFat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, satFat: 0 },
  );
}

export function combinedName(items: MealSessionItem[]): string {
  const names = items.map((i) => i.name.trim()).filter(Boolean);
  if (names.length <= 1) return names[0] || "Meal";
  if (names.length === 2) return `${names[0]} + ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} + ${names[names.length - 1]}`;
}

export function suggestMealTypeByTime(): MealEntry["mealType"] {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

export function toMealItem(data: any, source: MealSessionItem["source"], imagePreview?: string): MealSessionItem {
  return {
    id: crypto.randomUUID(),
    name: data.name || "Item",
    calories: Number(data.calories) || 0,
    protein: Number(data.protein) || 0,
    carbs: Number(data.carbs) || 0,
    fat: Number(data.fat) || 0,
    fiber: Number(data.fiber) || 0,
    sodium: Number(data.sodium) || 0,
    sugar: Number(data.sugar) || 0,
    satFat: Number(data.satFat) || 0,
    source,
    imagePreview,
  };
}