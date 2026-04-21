import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell, Target, Info, Pencil, Droplets, Languages, RotateCcw, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { computeBMI, formatHydration, getProfile, mlToUnit, resetOnboarding, saveProfile, type Allergy, type HydrationUnit, type Language, type UserProfile } from "@/lib/nutrition-store";
import { useToast } from "@/hooks/use-toast";
import i18n from "@/i18n";

const SettingsPage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [editing, setEditing] = useState(false);
  const [editingHydration, setEditingHydration] = useState(false);
  const [hydrationAmount, setHydrationAmount] = useState(String(mlToUnit(profile.hydrationTarget, profile.hydrationUnit)));
  const [hydrationUnit, setHydrationUnit] = useState<HydrationUnit>(profile.hydrationUnit);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetOnboarding = () => {
    resetOnboarding();
    toast({ title: t("settings.resetOnboardingToast") });
    navigate("/onboarding");
  };

  const update = (partial: Partial<UserProfile>) => {
    const next = { ...profile, ...partial };
    // Auto-recompute BMI if height or weight changed
    if (partial.heightCm !== undefined || partial.weightKg !== undefined) {
      next.bmi = computeBMI(next.heightCm, next.weightKg);
    }
    setProfile(next);
    saveProfile(next);
  };

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    update({ language: lang });
  };

  const MIN_ML = 1000;

  const unitMin: Record<HydrationUnit, number> = {
    ml: 1000,
    litres: 1,
    oz: 34,
    glasses: 4,
  };
  const unitStep: Record<HydrationUnit, number> = {
    ml: 50,
    litres: 0.1,
    oz: 1,
    glasses: 1,
  };

  const handleUnitChange = (newUnit: HydrationUnit) => {
    const n = Number(hydrationAmount);
    if (n > 0) {
      let ml = n;
      if (hydrationUnit === "glasses") ml = n * 250;
      else if (hydrationUnit === "litres") ml = n * 1000;
      else if (hydrationUnit === "oz") ml = n * 29.5735;
      setHydrationAmount(String(mlToUnit(Math.round(ml), newUnit)));
    }
    setHydrationUnit(newUnit);
  };

  const saveHydration = () => {
    const n = Number(hydrationAmount);
    if (!n || n <= 0) {
      toast({ title: t("settings.validAmount"), variant: "destructive" });
      return;
    }
    let ml = n;
    if (hydrationUnit === "glasses") ml = Math.round(n * 250);
    else if (hydrationUnit === "litres") ml = Math.round(n * 1000);
    else if (hydrationUnit === "oz") ml = Math.round(n * 29.5735);
    else ml = Math.round(n);

    if (ml < MIN_ML) {
      toast({
        title: t("settings.targetTooLow"),
        description: t("settings.targetTooLowDesc"),
        variant: "destructive",
      });
      return;
    }

    update({ hydrationTarget: ml, hydrationUnit });
    setEditingHydration(false);
    toast({ title: t("settings.targetUpdated"), description: formatHydration(ml, hydrationUnit) });
  };

  const lang = profile.language || "en";

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      {/* Language */}
      <div className="card-surface space-y-3">
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">{t("settings.language")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-secondary/60 border border-border">
          <button
            onClick={() => handleLanguageChange("en")}
            className={`text-xs font-semibold py-2 rounded-full transition-colors ${
              lang === "en" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={lang === "en"}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange("hi")}
            className={`text-xs font-semibold py-2 rounded-full transition-colors ${
              lang === "hi" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={lang === "hi"}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card-surface flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <User size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{t("settings.profile")}</p>
          <p className="text-xs text-muted-foreground truncate">
            {t("settings.age")} {profile.age} · {profile.dietType} · {t("settings.bmi")} {profile.bmi}
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
        >
          <Pencil size={16} className="text-muted-foreground" />
        </button>
      </div>

      {editing && (
        <div className="card-surface space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">{t("settings.age")}</label>
              <input type="number" value={profile.age} onChange={(e) => update({ age: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("onboarding.heightLabel")} (cm)</label>
              <input type="number" value={profile.heightCm} onChange={(e) => update({ heightCm: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("onboarding.weightLabel")} (kg)</label>
              <input type="number" value={profile.weightKg} onChange={(e) => update({ weightKg: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">{t("settings.bmi")}</span>
            <span className="text-sm font-semibold text-foreground">{profile.bmi}</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t("settings.dietType")}</label>
            <select value={profile.dietType} onChange={(e) => update({ dietType: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="Balanced">{t("settings.diet.balanced")}</option>
              <option value="Vegetarian (no meat)">{t("settings.diet.vegetarian")}</option>
              <option value="Vegan">{t("settings.diet.vegan")}</option>
              <option value="Keto">{t("settings.diet.keto")}</option>
              <option value="Paleo">{t("settings.diet.paleo")}</option>
            </select>
          </div>
          <button onClick={() => { setEditing(false); toast({ title: t("settings.profileSaved") }); }} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            {t("settings.saveProfile")}
          </button>
        </div>
      )}

      {/* Meal Reminders */}
      <div className="card-surface space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">{t("settings.reminders")}</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("settings.dailyReminders")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.remindersSub")}</p>
          </div>
          <button
            onClick={() => update({ remindersEnabled: !profile.remindersEnabled })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              profile.remindersEnabled ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${
              profile.remindersEnabled ? "left-[22px]" : "left-0.5"
            }`} />
          </button>
        </div>
        {profile.remindersEnabled && (
          <div className="space-y-2 pl-2 border-l-2 border-border ml-2">
            {(["morning", "midday", "evening"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-foreground capitalize">{t(`settings.${key}`)}</span>
                <span className="text-sm font-medium text-primary">{profile.reminderTimes[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nutrition Targets */}
      <div className="card-surface space-y-2">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">{t("settings.targets")}</h2>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("settings.dietType")}</span>
          <span className="font-medium text-foreground">{profile.dietType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("settings.bmi")}</span>
          <span className="font-medium text-foreground">{profile.bmi}</span>
        </div>

        <div className="pt-2 mt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets size={14} className="text-info" />
              <span className="text-sm text-muted-foreground">{t("settings.dailyHydration")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{formatHydration(profile.hydrationTarget, profile.hydrationUnit)}</span>
              <button
                onClick={() => {
                  setHydrationAmount(String(mlToUnit(profile.hydrationTarget, profile.hydrationUnit)));
                  setHydrationUnit(profile.hydrationUnit);
                  setEditingHydration(!editingHydration);
                }}
                className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80"
              >
                <Pencil size={12} className="text-muted-foreground" />
              </button>
            </div>
          </div>
          {editingHydration && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={unitMin[hydrationUnit]}
                  step={unitStep[hydrationUnit]}
                  value={hydrationAmount}
                  onChange={(e) => setHydrationAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={hydrationUnit}
                  onChange={(e) => handleUnitChange(e.target.value as HydrationUnit)}
                  className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ml">ml</option>
                  <option value="glasses">{t("dashboard.hydrationModal.glasses")}</option>
                  <option value="litres">{t("dashboard.hydrationModal.litres")}</option>
                  <option value="oz">fl oz</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.minHydration")}</p>
              <button
                onClick={saveHydration}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {t("settings.saveTarget")}
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-1">{t("settings.targetsHint")}</p>
      </div>

      {/* Allergies */}
      <div className="card-surface space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">{t("settings.allergiesTitle")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.allergiesHint")}</p>
        <div className="flex flex-wrap gap-2">
          {(["dairy","nuts","gluten","eggs","shellfish","soy"] as Allergy[]).map((a) => {
            const isSel = (profile.allergies ?? []).includes(a);
            return (
              <button
                key={a}
                onClick={() => {
                  const current = profile.allergies ?? [];
                  const next = isSel ? current.filter((x) => x !== a) : [...current, a];
                  update({ allergies: next });
                }}
                className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
                  isSel
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-muted-foreground"
                }`}
              >
                {t(`allergies.${a}`)}
              </button>
            );
          })}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("settings.allergiesOtherLabel")}</label>
          <input
            type="text"
            value={profile.allergiesOther ?? ""}
            onChange={(e) => update({ allergiesOther: e.target.value })}
            placeholder={t("settings.allergiesOtherPlaceholder")}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* About */}
      <div className="card-surface space-y-2">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">{t("settings.about")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("settings.aboutSub")}</p>
      </div>

      {/* Reset onboarding */}
      <button
        onClick={handleResetOnboarding}
        className="w-full card-surface flex items-center gap-3 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
          <RotateCcw size={18} className="text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{t("settings.resetOnboarding")}</p>
          <p className="text-xs text-muted-foreground">{t("settings.resetOnboardingHint")}</p>
        </div>
      </button>
    </div>
  );
};

export default SettingsPage;
