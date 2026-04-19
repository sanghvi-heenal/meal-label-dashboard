import { useState } from "react";
import CalorieRing from "@/components/CalorieRing";
import HydrationRing from "@/components/HydrationRing";
import { formatHydration, type HydrationUnit } from "@/lib/nutrition-store";

interface StatsToggleCardProps {
  calories: number;
  calorieTarget: number;
  hydrationMl: number;
  hydrationTarget: number;
  hydrationUnit: HydrationUnit;
}

type View = "calories" | "hydration";

const StatsToggleCard = ({
  calories,
  calorieTarget,
  hydrationMl,
  hydrationTarget,
  hydrationUnit,
}: StatsToggleCardProps) => {
  const [view, setView] = useState<View>("calories");
  const isCalories = view === "calories";
  const tintClass = isCalories ? "card-tint-warning" : "card-tint-info";

  const caloriesRemaining = Math.max(calorieTarget - calories, 0);
  const hydrationRemaining = Math.max(hydrationTarget - hydrationMl, 0);

  return (
    <div className={`card-surface ${tintClass} space-y-4`}>
      {/* Toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-secondary/60 border border-border">
        <button
          onClick={() => setView("calories")}
          className={`text-xs font-semibold py-1.5 rounded-full transition-colors ${
            isCalories ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          aria-pressed={isCalories}
        >
          Calories
        </button>
        <button
          onClick={() => setView("hydration")}
          className={`text-xs font-semibold py-1.5 rounded-full transition-colors ${
            !isCalories ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          aria-pressed={!isCalories}
        >
          Hydration
        </button>
      </div>

      {/* Body */}
      {isCalories ? (
        <div className="flex items-center gap-5">
          <CalorieRing consumed={calories} target={calorieTarget} />
          <div className="space-y-1.5 text-sm flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold bg-gradient-to-br from-warning to-warning/40 bg-clip-text text-transparent tabular-nums">
                {calories}
              </span>
              <span className="text-xs text-muted-foreground">/ {calorieTarget} kcal</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{caloriesRemaining}</span> kcal remaining
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <HydrationRing consumed={hydrationMl} target={hydrationTarget} size={120} />
          <div className="space-y-1.5 text-sm flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold bg-gradient-to-br from-info to-info/40 bg-clip-text text-transparent tabular-nums">
                {formatHydration(hydrationMl, hydrationUnit)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {formatHydration(hydrationTarget, hydrationUnit)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{formatHydration(hydrationRemaining, hydrationUnit)}</span> remaining
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsToggleCard;
