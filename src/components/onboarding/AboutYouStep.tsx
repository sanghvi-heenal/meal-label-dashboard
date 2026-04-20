import { useTranslation } from "react-i18next";
import { bmiCategory, computeBMI } from "@/lib/nutrition-store";

interface Props {
  step: number;
  total: number;
  age: number;
  heightCm: number;
  weightKg: number;
  onChange: (patch: { age?: number; heightCm?: number; weightKg?: number }) => void;
}

const AboutYouStep = ({ step, total, age, heightCm, weightKg, onChange }: Props) => {
  const { t } = useTranslation();
  const bmi = computeBMI(heightCm, weightKg);
  const cat = bmi > 0 ? bmiCategory(bmi) : null;

  const Field = ({
    label,
    suffix,
    value,
    min,
    max,
    onValue,
  }: {
    label: string;
    suffix: string;
    value: number;
    min: number;
    max: number;
    onValue: (n: number) => void;
  }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border-2 border-border bg-card focus-within:border-primary transition-colors">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value || ""}
          onChange={(e) => onValue(Number(e.target.value))}
          className="flex-1 bg-transparent px-4 py-3 text-base text-foreground focus:outline-none"
        />
        <span className="pr-4 text-sm text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          {t("onboarding.stepOf", { step, total })}
        </p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          {t("onboarding.aboutTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("onboarding.aboutSub")}</p>
      </div>

      <div className="space-y-3">
        <Field
          label={t("onboarding.ageLabel")}
          suffix={t("onboarding.years")}
          value={age}
          min={10}
          max={100}
          onValue={(n) => onChange({ age: n })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t("onboarding.heightLabel")}
            suffix="cm"
            value={heightCm}
            min={100}
            max={230}
            onValue={(n) => onChange({ heightCm: n })}
          />
          <Field
            label={t("onboarding.weightLabel")}
            suffix="kg"
            value={weightKg}
            min={25}
            max={250}
            onValue={(n) => onChange({ weightKg: n })}
          />
        </div>
      </div>

      {cat && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("onboarding.bmiLabel")}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {bmi} · <span className="text-primary">{t(`bmi.${cat}`)}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AboutYouStep;
