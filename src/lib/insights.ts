import type { MealEntry, UserProfile, AppJob, PainPoint } from "./nutrition-store";

export interface DayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
}

export function sumTotals(meals: MealEntry[]): DayTotals {
  return meals.reduce<DayTotals>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fiber: acc.fiber + m.fiber,
      sodium: acc.sodium + m.sodium,
      sugar: acc.sugar + m.sugar,
      satFat: acc.satFat + m.satFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, satFat: 0 }
  );
}

/** What % of the day is gone, 0-1. */
export function dayProgress(now = new Date()): number {
  const h = now.getHours() + now.getMinutes() / 60;
  // 06:00 → 22:00 spans the eating day
  return Math.max(0, Math.min(1, (h - 6) / 16));
}

function tone(jobs: AppJob[]) {
  if (jobs.includes("warn")) return "warn" as const;
  if (jobs.includes("teach")) return "teach" as const;
  if (jobs.includes("choose")) return "choose" as const;
  return "track" as const;
}

/* ─────────────────────────────  Today's summary  ───────────────────────────── */

export function buildSummary(
  totals: DayTotals,
  profile: UserProfile,
  hydrationMl: number,
): { headline: string; sub: string } {
  const t = dayProgress();
  const calRatio = totals.calories / Math.max(profile.calorieTarget, 1);
  const expectedCal = t; // expected fraction
  const proteinRatio = totals.protein / Math.max(profile.proteinTarget, 1);
  const hydrRatio = hydrationMl / Math.max(profile.hydrationTarget, 1);

  const issues: string[] = [];
  if (proteinRatio < expectedCal - 0.15) issues.push("protein is low so far");
  if (hydrRatio < expectedCal - 0.15) issues.push("hydration is behind");
  if (calRatio > expectedCal + 0.25) issues.push("calories are running ahead");

  const toneKey = tone(profile.appJobs);
  let headline: string;
  if (totals.calories === 0 && hydrationMl === 0) {
    headline = "Nothing logged yet — let's start your day.";
  } else if (issues.length === 0) {
    headline = toneKey === "warn" ? "On track. No red flags so far." : "Nice work — you're on pace.";
  } else if (toneKey === "warn") {
    headline = `Heads up: ${issues.join(" and ")}.`;
  } else if (toneKey === "teach") {
    headline = `Good start. ${issues[0].charAt(0).toUpperCase() + issues[0].slice(1)}.`;
  } else {
    headline = `Doing well. Watch — ${issues[0]}.`;
  }

  const sub =
    `${totals.calories} / ${profile.calorieTarget} kcal · ` +
    `${totals.protein}g protein · ${Math.round(hydrRatio * 100)}% hydration`;
  return { headline, sub };
}

/* ─────────────────────────────  Main risk today  ───────────────────────────── */

export function buildRisk(
  totals: DayTotals,
  profile: UserProfile,
  meals: MealEntry[],
): { label: string; detail: string; severity: "ok" | "watch" | "high" } | null {
  const drinkCal = meals.filter((m) => m.mealType === "drink").reduce((s, m) => s + m.calories, 0);

  // Highest signal wins.
  if (profile.sodiumTarget && totals.sodium > profile.sodiumTarget * 0.75) {
    return {
      label: "Sodium is high",
      detail: `${totals.sodium}mg of ${profile.sodiumTarget}mg — mostly from processed foods.`,
      severity: totals.sodium > profile.sodiumTarget ? "high" : "watch",
    };
  }
  if (profile.sugarTarget && totals.sugar > profile.sugarTarget * 0.75) {
    return {
      label: "Sugar is high",
      detail: `${totals.sugar.toFixed(0)}g of ${profile.sugarTarget}g — about ${Math.round(totals.sugar / 4)} tsp.`,
      severity: totals.sugar > profile.sugarTarget ? "high" : "watch",
    };
  }
  if (totals.calories > 200 && drinkCal / Math.max(totals.calories, 1) > 0.3) {
    return {
      label: "Drinks are driving calories",
      detail: `${drinkCal} kcal from drinks — over 30% of today's intake.`,
      severity: "watch",
    };
  }
  if (profile.fiberTarget && dayProgress() > 0.6 && totals.fiber < profile.fiberTarget * 0.3) {
    return {
      label: "Fiber is very low",
      detail: `Only ${totals.fiber.toFixed(0)}g of ${profile.fiberTarget}g — add veg, fruit, or whole grains.`,
      severity: "watch",
    };
  }
  if (profile.goal === "diabetes" && totals.carbs > profile.carbsTarget * 0.5 && totals.protein < profile.proteinTarget * 0.3) {
    return {
      label: "Carb-heavy, low protein",
      detail: "Pair carbs with protein to slow the glucose spike.",
      severity: "watch",
    };
  }
  return null;
}

/* ─────────────────────────────  Next action  ───────────────────────────── */

export function buildNextAction(
  totals: DayTotals,
  profile: UserProfile,
  hydrationMl: number,
): string {
  const h = new Date().getHours();
  const proteinRatio = totals.protein / Math.max(profile.proteinTarget, 1);
  const hydrRatio = hydrationMl / Math.max(profile.hydrationTarget, 1);
  const fiberRatio = totals.fiber / Math.max(profile.fiberTarget, 1);

  if (hydrRatio < 0.4) return "Drink a glass of water now — you're behind on hydration.";
  if (proteinRatio < 0.4 && h >= 11 && h <= 14) return "At lunch, add one protein food (eggs, dal, chicken, tofu).";
  if (proteinRatio < 0.6 && h >= 17) return "At dinner, prioritize a protein source — your day is short.";
  if (fiberRatio < 0.4 && h >= 12) return "Add a vegetable or fruit to your next meal.";
  if (totals.calories > profile.calorieTarget * 0.9 && h < 19) return "You're near your calorie target — keep the next meal light.";
  if (totals.calories === 0 && h >= 9) return "Log breakfast — even a small one helps the day.";
  return "You're on pace. Keep meals balanced — protein + veg + a smart carb.";
}

/* ─────────────────────────────  Per-meal verdict  ───────────────────────────── */

export type Verdict =
  | "balanced"
  | "carb_heavy"
  | "low_protein"
  | "high_sugar_drink"
  | "salty_processed"
  | "good_hydration"
  | "good_fiber";

export interface MealVerdict {
  tag: Verdict;
  label: string;
  why: string;
  tip?: string;
  tone: "good" | "watch" | "neutral";
}

export interface MealLike {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
  mealType?: MealEntry["mealType"];
}

export function verdictFor(meal: MealLike, profile: UserProfile): MealVerdict {
  const isDrink = meal.mealType === "drink";
  const cal = Math.max(meal.calories, 1);
  const proteinPct = (meal.protein * 4) / cal;
  const carbPct = (meal.carbs * 4) / cal;
  const sugarTsp = Math.round(meal.sugar / 4);
  const pains: PainPoint[] = profile.painPoints || [];

  // Drink-specific verdicts first
  if (isDrink) {
    if (meal.calories === 0 && /water/i.test(meal.name)) {
      return {
        tag: "good_hydration",
        label: "Good hydration choice",
        why: "Zero calories, pure hydration. Keep it up.",
        tone: "good",
      };
    }
    if (meal.sugar >= 15) {
      return {
        tag: "high_sugar_drink",
        label: "High-sugar drink",
        why: `≈ ${sugarTsp} tsp of sugar — about ${Math.round((meal.sugar / Math.max(profile.sugarTarget, 1)) * 100)}% of your daily allowance.`,
        tip: pains.includes("drinks")
          ? "Try a smaller size, or swap in unsweetened tea/sparkling water a few times a week."
          : "Consider less sweetener or a smaller serving next time.",
        tone: "watch",
      };
    }
  }

  if (meal.sodium >= 800) {
    return {
      tag: "salty_processed",
      label: "Salty / processed",
      why: `${meal.sodium}mg sodium — that's ${Math.round((meal.sodium / Math.max(profile.sodiumTarget, 1)) * 100)}% of your daily limit in one meal.`,
      tip: "Balance it with a low-sodium meal later (fresh veg, plain rice, fruit).",
      tone: "watch",
    };
  }

  if (carbPct > 0.6 && proteinPct < 0.15) {
    return {
      tag: "carb_heavy",
      label: "Carb-heavy",
      why: `Most calories here are carbs (${Math.round(carbPct * 100)}%). Protein is low.`,
      tip: pains.includes("carbs")
        ? "Pair with a protein side (egg, dal, yogurt, paneer) to slow the glucose response."
        : "Add a protein source to keep you full longer.",
      tone: "watch",
    };
  }

  if (proteinPct < 0.1 && meal.calories > 200 && !isDrink) {
    return {
      tag: "low_protein",
      label: "Low protein",
      why: `Only ${meal.protein}g protein in ${meal.calories} kcal.`,
      tip: pains.includes("protein")
        ? "Aim for ~20g protein per main meal — eggs, chicken, dal, tofu, paneer."
        : "Try to add a protein source.",
      tone: "watch",
    };
  }

  if (meal.fiber >= 6) {
    return {
      tag: "good_fiber",
      label: "Good fiber choice",
      why: `${meal.fiber}g fiber — great for digestion and steady energy.`,
      tone: "good",
    };
  }

  return {
    tag: "balanced",
    label: "Looks balanced",
    why: `${meal.protein}g protein · ${meal.carbs}g carbs · ${meal.fat}g fat — a reasonable mix.`,
    tip: pains.includes("portions") && meal.calories > 700
      ? "Portion is on the larger side — half it if you're trying to lose weight."
      : undefined,
    tone: "good",
  };
}
