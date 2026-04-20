import { useTranslation } from "react-i18next";
import { mlToUnit, unitToMl, type HydrationUnit } from "@/lib/nutrition-store";

interface Props {
  step: number;
  total: number;
  unit: HydrationUnit;
  currentMl: number;
  goalMl: number;
  onChange: (patch: { unit?: HydrationUnit; currentMl?: number; goalMl?: number }) => void;
}

const UNITS: { value: HydrationUnit; label: string }[] = [
  { value: "ml", label: "ml" },
  { value: "litres", label: "L" },
  { value: "oz", label: "fl oz" },
  { value: "glasses", label: "glasses" },
];

const HydrationStep = ({ step, total, unit, currentMl, goalMl, onChange }: Props) => {
  const { t } = useTranslation();

  const currentInUnit = mlToUnit(currentMl, unit);
  const goalInUnit = mlToUnit(goalMl, unit);

  const handleUnit = (newUnit: HydrationUnit) => {
    onChange({ unit: newUnit });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          {t("onboarding.stepOf", { step, total })}
        </p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          {t("onboarding.hydrationTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("onboarding.hydrationSub")}</p>
      </div>

      {/* Unit selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("onboarding.unitLabel")}
        </label>
        <div className="mt-1 grid grid-cols-4 gap-1 p-1 rounded-full bg-secondary/60 border border-border">
          {UNITS.map((u) => (
            <button
              key={u.value}
              onClick={() => handleUnit(u.value)}
              className={`text-xs font-semibold py-2 rounded-full transition-colors ${
                unit === u.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              aria-pressed={unit === u.value}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current intake */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("onboarding.currentHydration")}
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border-2 border-border bg-card focus-within:border-primary transition-colors">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={unit === "litres" || unit === "glasses" ? 0.1 : 1}
            value={currentInUnit || ""}
            onChange={(e) => onChange({ currentMl: unitToMl(Number(e.target.value), unit) })}
            className="flex-1 bg-transparent px-4 py-3 text-base text-foreground focus:outline-none"
          />
          <span className="pr-4 text-sm text-muted-foreground">
            {UNITS.find((u) => u.value === unit)?.label}
          </span>
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("onboarding.hydrationGoal")}
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border-2 border-border bg-card focus-within:border-primary transition-colors">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={unit === "litres" || unit === "glasses" ? 0.1 : 1}
            value={goalInUnit || ""}
            onChange={(e) => onChange({ goalMl: unitToMl(Number(e.target.value), unit) })}
            className="flex-1 bg-transparent px-4 py-3 text-base text-foreground focus:outline-none"
          />
          <span className="pr-4 text-sm text-muted-foreground">
            {UNITS.find((u) => u.value === unit)?.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HydrationStep;
