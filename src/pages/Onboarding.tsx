import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import StepCard, { type ChoiceOption } from "@/components/onboarding/StepCard";
import GoalPicker from "@/components/onboarding/GoalPicker";
import LanguagePicker from "@/components/onboarding/LanguagePicker";
import AboutYouStep from "@/components/onboarding/AboutYouStep";
import HydrationStep from "@/components/onboarding/HydrationStep";
import i18n, { type Language } from "@/i18n";
import { DIET_LABEL, dietValueFromStored, type DietValue } from "@/lib/diet-options";
import {
  computeBMI,
  getProfile,
  pushProfileToDb,
  saveProfile,
  type Allergy,
  type AppJob,
  type Goal,
  type HydrationUnit,
  type LogPref,
  type PainPoint,
} from "@/lib/nutrition-store";

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const profile = getProfile();

  const [language, setLanguage] = useState<Language>(profile.language || "en");
  const [age, setAge] = useState<number>(profile.age);
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg);
  const [diet, setDiet] = useState<DietValue[]>([dietValueFromStored(profile.dietType)]);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>(
    profile.goals && profile.goals.length ? profile.goals : []
  );
  const [logPref, setLogPref] = useState<LogPref[]>(profile.logPrefs);
  const [painPoints, setPainPoints] = useState<PainPoint[]>(profile.painPoints);
  const [appJobs, setAppJobs] = useState<AppJob[]>(profile.appJobs);
  const [hydrationUnit, setHydrationUnit] = useState<HydrationUnit>(profile.hydrationUnit);
  const [currentHydrationMl, setCurrentHydrationMl] = useState<number>(profile.currentHydrationMl);
  const [hydrationGoalMl, setHydrationGoalMl] = useState<number>(profile.hydrationTarget);
  const [allergies, setAllergies] = useState<Allergy[]>(profile.allergies ?? []);
  const [customAllergies, setCustomAllergies] = useState<string[]>(profile.customAllergies ?? []);
  const [customAllergyDraft, setCustomAllergyDraft] = useState<string>("");

  const total = 9;
  const GOAL_CAP = 3;
  const GOAL_MIN = 2;

  // Build localized option arrays from translation keys
  const goals: ChoiceOption<Goal>[] = [
    { value: "eat_healthy", emoji: "🥗", label: t("goals.eat_healthy.label"), hint: t("goals.eat_healthy.hint") },
    { value: "energy_mood", emoji: "⚡", label: t("goals.energy_mood.label"), hint: t("goals.energy_mood.hint") },
    { value: "lose_weight", emoji: "⚖️", label: t("goals.lose_weight.label"), hint: t("goals.lose_weight.hint") },
    { value: "gain_weight", emoji: "🍚", label: t("goals.gain_weight.label"), hint: t("goals.gain_weight.hint") },
    { value: "glucose", emoji: "🩺", label: t("goals.glucose.label"), hint: t("goals.glucose.hint") },
    { value: "heart", emoji: "❤️", label: t("goals.heart.label"), hint: t("goals.heart.hint") },
    { value: "menopause", emoji: "🌸", label: t("goals.menopause.label"), hint: t("goals.menopause.hint") },
  ];
  const logPrefs: ChoiceOption<LogPref>[] = [
    { value: "photo", emoji: "📷", label: t("logPrefs.photo.label"), hint: t("logPrefs.photo.hint") },
    { value: "voice", emoji: "🎤", label: t("logPrefs.voice.label"), hint: t("logPrefs.voice.hint") },
    { value: "text", emoji: "⌨️", label: t("logPrefs.text.label"), hint: t("logPrefs.text.hint") },
  ];
  const pains: ChoiceOption<PainPoint>[] = [
    { value: "portions", emoji: "🍽️", label: t("pains.portions.label") },
    { value: "sugar", emoji: "🍬", label: t("pains.sugar.label") },
    { value: "carbs", emoji: "🍞", label: t("pains.carbs.label") },
    { value: "protein", emoji: "🫘", label: t("pains.protein.label") },
    { value: "drinks", emoji: "🥤", label: t("pains.drinks.label") },
  ];
  const jobs: ChoiceOption<AppJob>[] = [
    { value: "track", emoji: "🎯", label: t("jobs.track.label") },
    { value: "teach", emoji: "🎓", label: t("jobs.teach.label") },
    { value: "warn", emoji: "🚨", label: t("jobs.warn.label") },
    { value: "choose", emoji: "💡", label: t("jobs.choose.label") },
  ];
  const ALL_ALLERGY_OPTIONS: ChoiceOption<Allergy>[] = [
    { value: "dairy", emoji: "🥛", label: t("allergies.dairy") },
    { value: "nuts", emoji: "🥜", label: t("allergies.nuts") },
    { value: "gluten", emoji: "🌾", label: t("allergies.gluten") },
    { value: "eggs", emoji: "🥚", label: t("allergies.eggs") },
    { value: "shellfish", emoji: "🦐", label: t("allergies.shellfish") },
    { value: "soy", emoji: "🫘", label: t("allergies.soy") },
  ];
  // Only surface animal-derived allergens the user's diet actually includes.
  const allowedAllergiesForDiet = (d: DietValue): Allergy[] => {
    switch (d) {
      case "vegan":
        return ["nuts", "gluten", "soy"];
      case "vegetarian":
      case "jain":
        return ["dairy", "nuts", "gluten", "soy"];
      case "eggetarian":
        return ["dairy", "nuts", "gluten", "soy", "eggs"];
      case "pescatarian":
        return ["dairy", "nuts", "gluten", "soy", "eggs", "shellfish"];
      default:
        return ["dairy", "nuts", "gluten", "eggs", "shellfish", "soy"];
    }
  };
  const activeDiet: DietValue = diet[0] ?? "none";
  const allowed = allowedAllergiesForDiet(activeDiet);
  const allergyOptions = ALL_ALLERGY_OPTIONS.filter((o) => allowed.includes(o.value));
  // Strip previously-selected allergies that are no longer valid for this diet.
  const visibleAllergies = allergies.filter((a) => allowed.includes(a));
  if (visibleAllergies.length !== allergies.length) {
    // Defer to avoid setState during render
    queueMicrotask(() => setAllergies(visibleAllergies));
  }
  const diets: ChoiceOption<DietValue>[] = [
    { value: "vegetarian", label: t("diets.vegetarian.label"), hint: t("diets.vegetarian.hint") },
    { value: "vegan", label: t("diets.vegan.label"), hint: t("diets.vegan.hint") },
    { value: "nonVeg", label: t("diets.nonVeg.label"), hint: t("diets.nonVeg.hint") },
    { value: "eggetarian", label: t("diets.eggetarian.label"), hint: t("diets.eggetarian.hint") },
    { value: "pescatarian", label: t("diets.pescatarian.label"), hint: t("diets.pescatarian.hint") },
    { value: "jain", label: t("diets.jain.label"), hint: t("diets.jain.hint") },
    { value: "keto", label: t("diets.keto.label"), hint: t("diets.keto.hint") },
    { value: "none", label: t("diets.none.label"), hint: t("diets.none.hint") },
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    saveProfile({ ...getProfile(), language: lang });
  };

  const finish = async () => {
    const next = {
      ...profile,
      language,
      age,
      heightCm,
      weightKg,
      bmi: computeBMI(heightCm, weightKg),
      dietType: DIET_LABEL[diet[0] ?? "none"],
      goals: selectedGoals.length ? selectedGoals : ["eat_healthy"],
      logPrefs: logPref.length ? logPref : ["photo", "voice", "text"],
      painPoints,
      appJobs: appJobs.length ? appJobs : ["track"],
      hydrationUnit,
      currentHydrationMl,
      hydrationTarget: hydrationGoalMl,
      allergies,
      allergiesOther: "",
      customAllergies,
      onboardedAt: new Date().toISOString(),
    };
    saveProfile(next);
    // Wait for the DB upsert so a hard refresh right after finish
    // doesn't bounce the user back into onboarding.
    await pushProfileToDb(next);
    navigate("/", { replace: true });
  };

  const skip = async () => {
    const next = { ...profile, language, onboardedAt: new Date().toISOString() };
    saveProfile(next);
    await pushProfileToDb(next);
    navigate("/", { replace: true });
  };

  const toggleMulti = <T extends string>(arr: T[], setter: (v: T[]) => void, v: T) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const toggleGoal = (v: Goal) => {
    setSelectedGoals((prev) => {
      if (prev.includes(v)) return prev.filter((g) => g !== v);
      if (prev.length >= GOAL_CAP) return prev;
      return [...prev, v];
    });
  };

  const stepValid = () => {
    if (step === 0) return !!language;
    if (step === 1)
      return age >= 10 && age <= 100 && heightCm >= 100 && heightCm <= 230 && weightKg >= 25 && weightKg <= 250;
    if (step === 2) return diet.length === 1;
    if (step === 3) return selectedGoals.length >= GOAL_MIN;
    if (step === 4) return logPref.length > 0;
    if (step === 5) return true;
    if (step === 6) return appJobs.length > 0;
    if (step === 7) return true; // allergies — optional/skippable
    if (step === 8) return currentHydrationMl >= 0 && hydrationGoalMl >= 1000;
    return false;
  };

  return (
    <div className="min-h-screen px-4 pt-8 pb-32 max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{t("onboarding.welcome")}</span>
        </div>
        <button
          onClick={skip}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("common.skip")}
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 animate-fade-in" key={step}>
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t("onboarding.stepOf", { step: 1, total })}
              </p>
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {t("onboarding.languageTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {t("onboarding.languageSub")}
              </p>
            </div>
            <LanguagePicker value={language} onChange={handleLanguageChange} />
          </div>
        )}
        {step === 1 && (
          <AboutYouStep
            step={2}
            total={total}
            age={age}
            heightCm={heightCm}
            weightKg={weightKg}
            onChange={(p) => {
              if (p.age !== undefined) setAge(p.age);
              if (p.heightCm !== undefined) setHeightCm(p.heightCm);
              if (p.weightKg !== undefined) setWeightKg(p.weightKg);
            }}
          />
        )}
        {step === 2 && (
          <StepCard
            step={3}
            total={total}
            title={t("onboarding.dietTitle")}
            subtitle={t("onboarding.dietSub")}
            options={diets}
            selected={diet}
            onToggle={(v) => setDiet([v])}
          />
        )}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t("onboarding.stepOf", { step: 4, total })}
              </p>
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {t("onboarding.goalsTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {t("onboarding.goalsSub")}
              </p>
            </div>
            <GoalPicker
              options={goals}
              selected={selectedGoals}
              onToggle={toggleGoal}
              cap={GOAL_CAP}
              min={GOAL_MIN}
            />
          </div>
        )}
        {step === 4 && (
          <StepCard
            step={5}
            total={total}
            title={t("onboarding.logPrefsTitle")}
            subtitle={t("onboarding.logPrefsSub")}
            options={logPrefs}
            selected={logPref}
            onToggle={(v) => toggleMulti(logPref, setLogPref, v)}
            multi
          />
        )}
        {step === 5 && (
          <StepCard
            step={6}
            total={total}
            title={t("onboarding.painsTitle")}
            subtitle={t("onboarding.painsSub")}
            options={pains}
            selected={painPoints}
            onToggle={(v) => toggleMulti(painPoints, setPainPoints, v)}
            multi
          />
        )}
        {step === 6 && (
          <StepCard
            step={7}
            total={total}
            title={t("onboarding.jobsTitle")}
            subtitle={t("onboarding.jobsSub")}
            options={jobs}
            selected={appJobs}
            onToggle={(v) => toggleMulti(appJobs, setAppJobs, v)}
            multi
          />
        )}
        {step === 7 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                {t("onboarding.stepOf", { step: 8, total })}
              </p>
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {t("onboarding.allergiesTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.allergiesSub")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergyOptions.map((opt) => {
                const isSel = allergies.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMulti(allergies, setAllergies, opt.value)}
                    className={`px-3 py-2 rounded-full border-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isSel
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {opt.emoji && <span aria-hidden="true">{opt.emoji}</span>}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
              {customAllergies.map((item) => (
                <span
                  key={`custom-${item}`}
                  className="px-3 py-2 rounded-full border-2 border-primary bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5"
                >
                  <span aria-hidden="true">🏷️</span>
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomAllergies((prev) => prev.filter((x) => x !== item))
                    }
                    aria-label={`Remove ${item}`}
                    className="ml-1 text-primary/70 hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t("onboarding.allergiesAddLabel")}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={customAllergyDraft}
                  onChange={(e) => setCustomAllergyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = customAllergyDraft.trim();
                      if (!v) return;
                      const exists = customAllergies.some(
                        (x) => x.toLowerCase() === v.toLowerCase()
                      );
                      if (!exists) setCustomAllergies((prev) => [...prev, v]);
                      setCustomAllergyDraft("");
                    }
                  }}
                  placeholder={t("onboarding.allergiesAddPlaceholder")}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = customAllergyDraft.trim();
                    if (!v) return;
                    const exists = customAllergies.some(
                      (x) => x.toLowerCase() === v.toLowerCase()
                    );
                    if (!exists) setCustomAllergies((prev) => [...prev, v]);
                    setCustomAllergyDraft("");
                  }}
                  disabled={!customAllergyDraft.trim()}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {t("onboarding.allergiesAddCta")}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t("onboarding.allergiesSkippable")}
            </p>
          </div>
        )}
        {step === 8 && (
          <HydrationStep
            step={9}
            total={total}
            unit={hydrationUnit}
            currentMl={currentHydrationMl}
            goalMl={hydrationGoalMl}
            onChange={(p) => {
              if (p.unit !== undefined) setHydrationUnit(p.unit);
              if (p.currentMl !== undefined) setCurrentHydrationMl(p.currentMl);
              if (p.goalMl !== undefined) setHydrationGoalMl(p.goalMl);
            }}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="flex gap-2 pt-6">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80"
          >
            <ArrowLeft size={16} /> {t("common.back")}
          </button>
        )}
        <button
          onClick={() => (step < total - 1 ? setStep((s) => s + 1) : finish())}
          disabled={!stepValid()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {step < total - 1 ? (
            <>
              {t("common.continue")} <ArrowRight size={16} />
            </>
          ) : (
            <>
              {t("common.finish")} <Sparkles size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
