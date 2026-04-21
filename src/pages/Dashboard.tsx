import { useEffect, useState } from "react";
import { User, Lightbulb, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CalorieRing from "@/components/CalorieRing";
import HydrationRing from "@/components/HydrationRing";
import MacroBar from "@/components/MacroBar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import RiskCard from "@/components/dashboard/RiskCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  formatHydration,
  getHydrationFromMeals,
  getMealsByDate,
  getProfile,
  getTodayString,
  mlToUnit,
  saveProfile,
  unitLabel,
  type HydrationUnit,
} from "@/lib/nutrition-store";
import { buildRisk, buildSummary, sumTotals } from "@/lib/insights";

const HYDRATION_ONBOARDED_KEY = "nutrilens-hydration-onboarded";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(getProfile());
  const [detailView, setDetailView] = useState<"calories" | "hydration">("calories");
  const todayMeals = getMealsByDate(getTodayString());

  // First-run hydration onboarding (kept; only shows after main onboarding completes)
  const [showHydrationModal, setShowHydrationModal] = useState(false);
  const [hydrationAmount, setHydrationAmount] = useState("8");
  const [hydrationUnit, setHydrationUnit] = useState<HydrationUnit>("glasses");

  useEffect(() => {
    const onboarded = localStorage.getItem(HYDRATION_ONBOARDED_KEY);
    if (!onboarded) setShowHydrationModal(true);
  }, []);

  const saveHydrationTarget = () => {
    const n = Number(hydrationAmount);
    let ml = profile.hydrationTarget;
    if (n > 0) {
      if (hydrationUnit === "glasses") ml = Math.round(n * 250);
      else if (hydrationUnit === "litres") ml = Math.round(n * 1000);
      else if (hydrationUnit === "oz") ml = Math.round(n * 29.5735);
      else ml = Math.round(n);
    }
    const next = { ...profile, hydrationTarget: ml, hydrationUnit };
    saveProfile(next);
    setProfile(next);
    localStorage.setItem(HYDRATION_ONBOARDED_KEY, "1");
    setShowHydrationModal(false);
  };

  const skipHydrationSetup = () => {
    localStorage.setItem(HYDRATION_ONBOARDED_KEY, "1");
    setShowHydrationModal(false);
  };

  const totals = sumTotals(todayMeals);
  const hydrationMl = getHydrationFromMeals(todayMeals);
  const remaining = Math.max(profile.calorieTarget - totals.calories, 0);
  const hydrationRemaining = Math.max(profile.hydrationTarget - hydrationMl, 0);

  const summary = buildSummary(totals, profile, hydrationMl);
  const risk = buildRisk(totals, profile, todayMeals);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greeting.morning") : hour < 17 ? t("greeting.afternoon") : t("greeting.evening");

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.today")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-info/20 text-info">
            ⚖ {t("dashboard.bmi")} {profile.bmi}
          </span>
          <button
            onClick={() => navigate("/settings")}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
            aria-label={t("dashboard.profileAria")}
          >
            <User size={20} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* 1. Friendly headline / empty state */}
      <div className="animate-fade-in" style={{ animationDelay: "60ms" }}>
        <SummaryCard headline={summary.headline} sub={summary.sub} />
      </div>

      {/* 2. Main risk today */}
      <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <RiskCard risk={risk} />
      </div>

      {/* Full rings & breakdown — always visible */}
      <div className="space-y-4 animate-fade-in">
        {/* Calories | Hydration toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-secondary/60 border border-border">
            <button
              onClick={() => setDetailView("calories")}
              className={`text-xs font-semibold py-1.5 rounded-full transition-colors ${
                detailView === "calories" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              aria-pressed={detailView === "calories"}
            >
              {t("dashboard.calories")}
            </button>
            <button
              onClick={() => setDetailView("hydration")}
              className={`text-xs font-semibold py-1.5 rounded-full transition-colors ${
                detailView === "hydration" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              aria-pressed={detailView === "hydration"}
            >
              {t("dashboard.hydration")}
            </button>
          </div>

          {detailView === "calories" ? (
            /* Calories ring detail */
            <div className="card-surface card-tint-warning space-y-4">
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("dashboard.todaysCalories")}
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold bg-gradient-to-br from-warning to-warning/40 bg-clip-text text-transparent">
                  {totals.calories}
                </span>
                <span className="text-muted-foreground text-sm">/ {profile.calorieTarget} {t("dashboard.kcal")}</span>
              </div>
              <div className="flex items-center gap-6">
                <CalorieRing consumed={totals.calories} target={profile.calorieTarget} />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-muted-foreground">{t("dashboard.consumed")}</span>
                    <span className="ml-auto font-semibold text-warning">{totals.calories} {t("dashboard.kcal")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-muted-foreground">{t("dashboard.remaining")}</span>
                    <span className="ml-auto font-semibold text-foreground">{remaining} {t("dashboard.kcal")}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/log")}
                className="w-full py-2 rounded-lg bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning text-sm font-semibold transition-colors active:scale-95"
              >
                {t("dashboard.logMeal")}
              </button>
            </div>
          ) : (
            /* Hydration ring detail */
            <div className="card-surface card-tint-info space-y-4">
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("dashboard.todaysHydration")}
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold bg-gradient-to-br from-info to-info/40 bg-clip-text text-transparent">
                  {mlToUnit(hydrationMl, profile.hydrationUnit)}
                </span>
                <span className="text-muted-foreground text-sm">
                  / {mlToUnit(profile.hydrationTarget, profile.hydrationUnit)} {unitLabel(profile.hydrationUnit)}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <HydrationRing consumed={hydrationMl} target={profile.hydrationTarget} size={120} />
                <div className="space-y-2 text-sm flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-info" />
                    <span className="text-muted-foreground">{t("dashboard.consumed")}</span>
                    <span className="ml-auto font-semibold text-info">{formatHydration(hydrationMl, profile.hydrationUnit)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-muted-foreground">{t("dashboard.remaining")}</span>
                    <span className="ml-auto font-semibold text-foreground">{formatHydration(hydrationRemaining, profile.hydrationUnit)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/log", { state: { mode: "drink" } })}
                className="w-full py-2 rounded-lg bg-info/10 hover:bg-info/20 border border-info/30 text-info text-sm font-semibold transition-colors active:scale-95"
              >
                {t("dashboard.logDrink")}
              </button>
            </div>
          )}

          {/* Macros */}
          <div className="card-surface card-tint-primary space-y-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("dashboard.macros")}
            </h2>
            <MacroBar label={t("dashboard.protein")} current={totals.protein} goal={profile.proteinTarget} unit="g" colorClass="text-nutrient-protein" bgClass="bg-nutrient-protein" />
            <MacroBar label={t("dashboard.carbs")} current={totals.carbs} goal={profile.carbsTarget} unit="g" colorClass="text-nutrient-carbs" bgClass="bg-nutrient-carbs" />
            <MacroBar label={t("dashboard.fat")} current={totals.fat} goal={profile.fatTarget} unit="g" colorClass="text-nutrient-fat" bgClass="bg-nutrient-fat" />
            <MacroBar label={t("dashboard.fiber")} current={totals.fiber} goal={profile.fiberTarget} unit="g" colorClass="text-nutrient-fiber" bgClass="bg-nutrient-fiber" />
          </div>

          {/* Quick stats */}
          <div className="card-surface">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="text-center py-2">
                <p className={`text-lg font-bold ${totals.sodium > profile.sodiumTarget ? "text-[hsl(var(--over-target))]" : "text-nutrient-protein"}`}>{totals.sodium}mg</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.sodium")}</p>
                <p className="text-[10px] text-muted-foreground">/ {profile.sodiumTarget}</p>
              </div>
              <div className="text-center py-2">
                <p className={`text-lg font-bold ${totals.sugar > profile.sugarTarget ? "text-[hsl(var(--over-target))]" : "text-nutrient-carbs"}`}>{totals.sugar.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.sugar")}</p>
                <p className="text-[10px] text-muted-foreground">/ {profile.sugarTarget}</p>
              </div>
              <div className="text-center py-2">
                <p className={`text-lg font-bold ${totals.satFat > profile.satFatTarget ? "text-[hsl(var(--over-target))]" : "text-nutrient-fat"}`}>{totals.satFat.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.satFat")}</p>
                <p className="text-[10px] text-muted-foreground">/ {profile.satFatTarget}</p>
              </div>
            </div>
          </div>

          {/* Meal ideas entry */}
          <button
            onClick={() => navigate("/suggestions")}
            className="card-surface card-tint-primary w-full flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("dashboard.getIdeas")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.getIdeasSub")}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </button>
        </div>


      {/* First-run hydration onboarding */}
      <Dialog open={showHydrationModal} onOpenChange={(open) => !open && skipHydrationSetup()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.hydrationModal.title")}</DialogTitle>
            <DialogDescription>{t("dashboard.hydrationModal.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={hydrationAmount}
              onChange={(e) => setHydrationAmount(e.target.value)}
              className="flex-1"
            />
            <select
              value={hydrationUnit}
              onChange={(e) => setHydrationUnit(e.target.value as HydrationUnit)}
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="glasses">{t("dashboard.hydrationModal.glasses")}</option>
              <option value="litres">{t("dashboard.hydrationModal.litres")}</option>
              <option value="ml">{t("dashboard.hydrationModal.ml")}</option>
              <option value="oz">{t("dashboard.hydrationModal.oz")}</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            ≈ {(() => {
              const n = Number(hydrationAmount);
              if (!n) return "0 ml";
              if (hydrationUnit === "glasses") return `${Math.round(n * 250)} ml`;
              if (hydrationUnit === "litres") return `${Math.round(n * 1000)} ml`;
              if (hydrationUnit === "oz") return `${Math.round(n * 29.5735)} ml`;
              return `${Math.round(n)} ml`;
            })()}
          </p>
          <DialogFooter>
            <button
              onClick={skipHydrationSetup}
              className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80"
            >
              {t("common.skip")}
            </button>
            <button
              onClick={saveHydrationTarget}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              {t("dashboard.hydrationModal.save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
