import { useState } from "react";
import { GlassWater, Plus, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HydrationRing from "@/components/HydrationRing";
import {
  getHydrationFromMeals,
  getMealsByDate,
  getProfile,
  getTodayString,
  saveMeal,
  type MealEntry,
} from "@/lib/nutrition-store";
import { useToast } from "@/hooks/use-toast";

const Hydration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [, forceRefresh] = useState(0);

  const profile = getProfile();
  const today = getTodayString();
  const todayMeals = getMealsByDate(today);
  const drinks = todayMeals.filter((m) => m.mealType === "drink");
  const hydrationMl = getHydrationFromMeals(todayMeals);
  const remaining = Math.max(profile.hydrationTarget - hydrationMl, 0);

  const quickLogWater = (ml: number) => {
    const entry: MealEntry = {
      id: crypto.randomUUID(),
      date: today,
      mealType: "drink",
      name: `Water (${ml}ml)`,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
      sugar: 0,
      satFat: 0,
      timestamp: Date.now(),
    };
    saveMeal(entry);
    toast({ title: "💧 Hydration logged", description: `+ ${ml}ml water` });
    forceRefresh((n) => n + 1);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hydration</h1>
        <p className="text-sm text-muted-foreground">Today's intake</p>
      </div>

      {/* Hydration Card */}
      <div className="card-surface space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">{hydrationMl}</span>
          <span className="text-muted-foreground text-sm">/ {profile.hydrationTarget} ml</span>
        </div>
        <div className="flex items-center gap-6">
          <HydrationRing consumed={hydrationMl} target={profile.hydrationTarget} size={140} />
          <div className="space-y-2 text-sm flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-info" />
              <span className="text-muted-foreground">Consumed</span>
              <span className="ml-auto font-semibold text-info">{hydrationMl} ml</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Remaining</span>
              <span className="ml-auto font-semibold text-foreground">{remaining} ml</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Target</span>
              <span className="ml-auto font-semibold text-primary">{profile.hydrationTarget} ml</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick log water */}
      <div className="card-surface space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Quick log water
        </h2>
        <div className="flex gap-2">
          {[150, 250, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => quickLogWater(ml)}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg bg-info/10 hover:bg-info/20 border border-info/30 text-info font-semibold transition-colors"
            >
              <Droplets size={18} />
              <span className="text-sm">+{ml}ml</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/log", { state: { mode: "drink" } })}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
        >
          <Plus size={18} />
          Log a drink (tea, coffee, smoothie…)
        </button>
      </div>

      {/* Today's drinks */}
      <div className="card-surface space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Today's drinks
        </h2>
        {drinks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <GlassWater size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No drinks logged yet today.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {drinks.map((d) => (
              <li key={d.id} className="py-2 flex items-center justify-between gap-2">
                <span className="text-sm text-foreground truncate">{d.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {d.calories > 0 ? `${d.calories} kcal` : "0 kcal"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Hydration;
