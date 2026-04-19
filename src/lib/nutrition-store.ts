export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "drink";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
  timestamp: number;
}

export type HydrationUnit = "ml" | "litres" | "oz" | "glasses";

export type Goal = "weight" | "diabetes" | "menopause" | "general";
export type LogPref = "photo" | "voice" | "text";
export type PainPoint = "portions" | "sugar" | "carbs" | "protein" | "drinks";
export type AppJob = "track" | "teach" | "warn" | "choose";

export interface UserProfile {
  age: number;
  dietType: string;
  bmi: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fiberTarget: number;
  sodiumTarget: number;
  sugarTarget: number;
  satFatTarget: number;
  hydrationTarget: number; // ml per day (canonical)
  hydrationUnit: HydrationUnit; // user's preferred display unit
  remindersEnabled: boolean;
  reminderTimes: { morning: string; midday: string; evening: string };
  // Onboarding answers — drive personalization across dashboard, log, and meal verdict.
  goal: Goal;
  logPrefs: LogPref[];
  painPoints: PainPoint[];
  appJobs: AppJob[];
  onboardedAt: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 30,
  dietType: "Balanced",
  bmi: 22,
  calorieTarget: 2000,
  proteinTarget: 55,
  carbsTarget: 280,
  fatTarget: 60,
  fiberTarget: 32,
  sodiumTarget: 2300,
  sugarTarget: 48,
  satFatTarget: 18,
  hydrationTarget: 2000,
  hydrationUnit: "ml",
  remindersEnabled: true,
  reminderTimes: { morning: "08:00", midday: "13:00", evening: "19:00" },
  goal: "general",
  logPrefs: ["photo", "voice", "text"],
  painPoints: [],
  appJobs: ["track"],
  onboardedAt: null,
};

export function isOnboarded(): boolean {
  return Boolean(getProfile().onboardedAt);
}

const ML_PER_GLASS = 250;
const ML_PER_OZ = 29.5735;

/** Convert ml to user's preferred unit, returning a nicely-rounded number. */
export function mlToUnit(ml: number, unit: HydrationUnit): number {
  if (unit === "litres") return Math.round((ml / 1000) * 10) / 10; // 1 decimal
  if (unit === "oz") return Math.round(ml / ML_PER_OZ);
  if (unit === "glasses") return Math.round((ml / ML_PER_GLASS) * 10) / 10; // 1 decimal
  return Math.round(ml);
}

/** Short label for the unit, e.g. "ml", "L", "fl oz", "glasses". */
export function unitLabel(unit: HydrationUnit): string {
  if (unit === "litres") return "L";
  if (unit === "oz") return "fl oz";
  if (unit === "glasses") return "glasses";
  return "ml";
}

/** Format a ml value in the user's preferred unit, e.g. "1.5 L", "320 ml", "8 glasses". */
export function formatHydration(ml: number, unit: HydrationUnit): string {
  return `${mlToUnit(ml, unit)} ${unitLabel(unit)}`;
}

export function getProfile(): UserProfile {
  const stored = localStorage.getItem("nutrilens-profile");
  return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem("nutrilens-profile", JSON.stringify(profile));
}

export function getMeals(): MealEntry[] {
  const stored = localStorage.getItem("nutrilens-meals");
  return stored ? JSON.parse(stored) : [];
}

export function saveMeal(meal: MealEntry) {
  const meals = getMeals();
  meals.push(meal);
  localStorage.setItem("nutrilens-meals", JSON.stringify(meals));
}

export function getMealsByDate(date: string): MealEntry[] {
  return getMeals().filter((m) => m.date === date);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function deleteMeal(id: string) {
  const meals = getMeals().filter((m) => m.id !== id);
  localStorage.setItem("nutrilens-meals", JSON.stringify(meals));
}

/**
 * Sums hydration (in ml) from drink entries by parsing the volume out of the entry name.
 * Names are stored like "Water (250ml)" or "Masala chai (330 ml)" — supports both ml and oz.
 */
export function getHydrationFromMeals(meals: MealEntry[]): number {
  return meals
    .filter((m) => m.mealType === "drink")
    .reduce((total, m) => {
      const mlMatch = m.name.match(/(\d+(?:\.\d+)?)\s*ml/i);
      if (mlMatch) return total + Number(mlMatch[1]);
      const ozMatch = m.name.match(/(\d+(?:\.\d+)?)\s*oz/i);
      if (ozMatch) return total + Math.round(Number(ozMatch[1]) * 29.5735);
      return total;
    }, 0);
}
