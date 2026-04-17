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
  remindersEnabled: boolean;
  reminderTimes: { morning: string; midday: string; evening: string };
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
  remindersEnabled: true,
  reminderTimes: { morning: "08:00", midday: "13:00", evening: "19:00" },
};

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
