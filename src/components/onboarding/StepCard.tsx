import { Check } from "lucide-react";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  emoji?: string;
}

interface StepCardProps<T extends string> {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  options: ChoiceOption<T>[];
  selected: T[];
  onToggle: (v: T) => void;
  multi?: boolean;
}

const StepCard = <T extends string>({
  step,
  total,
  title,
  subtitle,
  options,
  selected,
  onToggle,
  multi = false,
}: StepCardProps<T>) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          Step {step} of {total}
        </p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSel = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                isSel
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              {opt.emoji && (
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {opt.emoji}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isSel ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </p>
                {opt.hint && (
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.hint}</p>
                )}
              </div>
              <div
                className={`shrink-0 w-5 h-5 rounded-${multi ? "md" : "full"} border-2 flex items-center justify-center transition-colors ${
                  isSel ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {isSel && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {multi && (
        <p className="text-xs text-muted-foreground text-center">Pick as many as apply.</p>
      )}
    </div>
  );
};

export default StepCard;
