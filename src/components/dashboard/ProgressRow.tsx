import { formatHydration, type HydrationUnit } from "@/lib/nutrition-store";

interface MetricProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  colorClass: string;
  formattedValue?: string;
  formattedTarget?: string;
}

const Metric = ({ label, value, target, unit = "", colorClass, formattedValue, formattedTarget }: MetricProps) => {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {formattedValue ?? `${Math.round(value)}${unit}`}
          <span className="opacity-60"> / {formattedTarget ?? `${Math.round(target)}${unit}`}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

interface ProgressRowProps {
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  fiber: number;
  fiberTarget: number;
  hydrationMl: number;
  hydrationTarget: number;
  hydrationUnit: HydrationUnit;
  showCarbs?: boolean;
  carbs?: number;
  carbsTarget?: number;
}

const ProgressRow = ({
  calories,
  calorieTarget,
  protein,
  proteinTarget,
  fiber,
  fiberTarget,
  hydrationMl,
  hydrationTarget,
  hydrationUnit,
  showCarbs,
  carbs = 0,
  carbsTarget = 0,
}: ProgressRowProps) => (
  <div className="card-surface space-y-3">
    <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      Goal progress
    </h2>
    <Metric label="Calories" value={calories} target={calorieTarget} unit=" kcal" colorClass="bg-warning" />
    <Metric
      label="Hydration"
      value={hydrationMl}
      target={hydrationTarget}
      colorClass="bg-info"
      formattedValue={formatHydration(hydrationMl, hydrationUnit)}
      formattedTarget={formatHydration(hydrationTarget, hydrationUnit)}
    />
    <Metric label="Protein" value={protein} target={proteinTarget} unit="g" colorClass="bg-nutrient-protein" />
    <Metric label="Fiber" value={fiber} target={fiberTarget} unit="g" colorClass="bg-nutrient-fiber" />
    {showCarbs && (
      <Metric label="Carb balance" value={carbs} target={carbsTarget} unit="g" colorClass="bg-nutrient-carbs" />
    )}
  </div>
);

export default ProgressRow;
