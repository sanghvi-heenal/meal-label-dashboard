import { useTranslation } from "react-i18next";
import { Sun, Moon, Cookie, Coffee, Leaf, Flame } from "lucide-react";

export type MealTypeFilter = "breakfast" | "lunch" | "dinner" | "snack";
export type MealWeightFilter = "light" | "heavy";

interface IdeasFiltersProps {
  mealType: MealTypeFilter | null;
  mealWeight: MealWeightFilter;
  onMealTypeChange: (v: MealTypeFilter) => void;
  onMealWeightChange: (v: MealWeightFilter) => void;
}

const TYPE_OPTIONS: Array<{ value: MealTypeFilter; icon: typeof Sun; tKey: string }> = [
  { value: "breakfast", icon: Coffee, tKey: "suggestions.filters.breakfast" },
  { value: "lunch", icon: Sun, tKey: "suggestions.filters.lunch" },
  { value: "snack", icon: Cookie, tKey: "suggestions.filters.snack" },
  { value: "dinner", icon: Moon, tKey: "suggestions.filters.dinner" },
];

const IdeasFilters = ({ mealType, mealWeight, onMealTypeChange, onMealWeightChange }: IdeasFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Meal type pills — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        {TYPE_OPTIONS.map(({ value, icon: Icon, tKey }) => {
          const active = mealType === value;
          return (
            <button
              key={value}
              onClick={() => onMealTypeChange(value)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold border transition-colors active:scale-95 ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/60 text-foreground border-border hover:bg-secondary"
              }`}
              aria-pressed={active}
            >
              <Icon size={13} />
              {t(tKey)}
            </button>
          );
        })}
      </div>

      {/* Light / Heavy segmented control with helper text */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">{t("suggestions.filters.weightPrompt")}</p>
        <div className="inline-flex p-1 rounded-full bg-secondary/60 border border-border">
        <button
          onClick={() => onMealWeightChange("light")}
          className={`inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
            mealWeight === "light"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
          aria-pressed={mealWeight === "light"}
        >
          <Leaf size={13} />
          {t("suggestions.filters.light")}
        </button>
        <button
          onClick={() => onMealWeightChange("heavy")}
          className={`inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
            mealWeight === "heavy"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
          aria-pressed={mealWeight === "heavy"}
        >
          <Flame size={13} />
          {t("suggestions.filters.heavy")}
        </button>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">{t("suggestions.filters.weightHelp")}</p>
      </div>
    </div>
  );
};

export default IdeasFilters;

/** Default meal type based on current local time. */
export function autoPickMealType(date = new Date()): MealTypeFilter {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 18) return "snack";
  if (h >= 18 && h < 23) return "dinner";
  return "snack"; // late night → light snack
}