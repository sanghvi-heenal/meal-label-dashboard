import { useTranslation } from "react-i18next";

export interface Suggestion {
  name: string;
  whyItFits: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quickTip: string;
  tags: string[];
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
}

const SuggestionCard = ({ suggestion, index }: SuggestionCardProps) => {
  const { t } = useTranslation();
  const s = suggestion;

  return (
    <div
      className="card-surface space-y-3 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground leading-tight">{s.name}</h3>
        <span className="text-xs font-bold text-warning whitespace-nowrap">
          {s.calories} {t("dashboard.kcal")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">{t("suggestions.whyItFits")}: </span>
        {s.whyItFits}
      </p>

      <div className="flex gap-3 text-[11px] font-medium">
        <span className="text-nutrient-protein">P {s.protein}g</span>
        <span className="text-nutrient-carbs">C {s.carbs}g</span>
        <span className="text-nutrient-fat">F {s.fat}g</span>
        <span className="text-nutrient-fiber">Fib {s.fiber}g</span>
      </div>

      <div className="rounded-lg bg-secondary/60 px-3 py-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">{t("suggestions.quickTip")}: </span>
          {s.quickTip}
        </p>
      </div>

      {s.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestionCard;
