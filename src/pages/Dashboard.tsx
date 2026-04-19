import { useEffect, useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CalorieRing from "@/components/CalorieRing";
import HydrationRing from "@/components/HydrationRing";
import MacroBar from "@/components/MacroBar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import RiskCard from "@/components/dashboard/RiskCard";
import ProgressRow from "@/components/dashboard/ProgressRow";
import NextActionCard from "@/components/dashboard/NextActionCard";
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
  getGreeting,
  getHydrationFromMeals,
  getMealsByDate,
  getProfile,
  getTodayString,
  mlToUnit,
  saveProfile,
  unitLabel,
  type HydrationUnit,
} from "@/lib/nutrition-store";
import { buildNextAction, buildRisk, buildSummary, sumTotals } from "@/lib/insights";

const HYDRATION_ONBOARDED_KEY = "nutrilens-hydration-onboarded";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getProfile());
  const [showDetails, setShowDetails] = useState(false);
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
  const nextAction = buildNextAction(totals, profile, hydrationMl);

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}</h1>
          <p className="text-sm text-muted-foreground">Today</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-info/20 text-info">
            ⚖ BMI {profile.bmi}
          </span>
          <button
            onClick={() => navigate("/settings")}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
            aria-label="Profile and settings"
          >
            <User size={20} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* 1. Today's summary */}
      <div className="animate-fade-in" style={{ animationDelay: "60ms" }}>
        <SummaryCard headline={summary.headline} sub={summary.sub} />
      </div>

      {/* 2. Main risk today */}
      <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <RiskCard risk={risk} />
      </div>

      {/* 3. Goal progress */}
      <div className="animate-fade-in" style={{ animationDelay: "180ms" }}>
        <ProgressRow
          calories={totals.calories}
          calorieTarget={profile.calorieTarget}
          protein={totals.protein}
          proteinTarget={profile.proteinTarget}
          fiber={totals.fiber}
          fiberTarget={profile.fiberTarget}
          hydrationMl={hydrationMl}
          hydrationTarget={profile.hydrationTarget}
          hydrationUnit={profile.hydrationUnit}
          showCarbs={profile.goal === "diabetes"}
          carbs={totals.carbs}
          carbsTarget={profile.carbsTarget}
        />
      </div>

      {/* 4. Next action */}
      <div className="animate-fade-in" style={{ animationDelay: "240ms" }}>
        <NextActionCard action={nextAction} onLog={() => navigate("/log")} />
      </div>

      {/* See details — full rings & breakdown */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={showDetails}
      >
        {showDetails ? "Hide details" : "See details"}
        <ChevronDown
          size={14}
          className={`transition-transform ${showDetails ? "rotate-180" : ""}`}
        />
      </button>

      {showDetails && (
        <div className="space-y-4 animate-fade-in">
          {/* Calories ring detail */}
          <div className="card-surface card-tint-warning space-y-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Today's calories
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold bg-gradient-to-br from-warning to-warning/40 bg-clip-text text-transparent">
                {totals.calories}
              </span>
              <span className="text-muted-foreground text-sm">/ {profile.calorieTarget} kcal</span>
            </div>
            <div className="flex items-center gap-6">
              <CalorieRing consumed={totals.calories} target={profile.calorieTarget} />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Consumed</span>
                  <span className="ml-auto font-semibold text-warning">{totals.calories} kcal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="ml-auto font-semibold text-foreground">{remaining} kcal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hydration ring detail */}
          <div className="card-surface card-tint-info space-y-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Today's hydration
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
                  <span className="text-muted-foreground">Consumed</span>
                  <span className="ml-auto font-semibold text-info">{formatHydration(hydrationMl, profile.hydrationUnit)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="ml-auto font-semibold text-foreground">{formatHydration(hydrationRemaining, profile.hydrationUnit)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/log", { state: { mode: "drink" } })}
              className="w-full py-2 rounded-lg bg-info/10 hover:bg-info/20 border border-info/30 text-info text-sm font-semibold transition-colors active:scale-95"
            >
              + Log a drink
            </button>
          </div>

          {/* Macros */}
          <div className="card-surface card-tint-primary space-y-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Macronutrients
            </h2>
            <MacroBar label="Protein" current={totals.protein} goal={profile.proteinTarget} unit="g" colorClass="text-nutrient-protein" bgClass="bg-nutrient-protein" />
            <MacroBar label="Carbs" current={totals.carbs} goal={profile.carbsTarget} unit="g" colorClass="text-nutrient-carbs" bgClass="bg-nutrient-carbs" />
            <MacroBar label="Fat" current={totals.fat} goal={profile.fatTarget} unit="g" colorClass="text-nutrient-fat" bgClass="bg-nutrient-fat" />
            <MacroBar label="Fiber" current={totals.fiber} goal={profile.fiberTarget} unit="g" colorClass="text-nutrient-fiber" bgClass="bg-nutrient-fiber" />
          </div>

          {/* Quick stats */}
          <div className="card-surface">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="text-center py-2">
                <p className="text-lg font-bold text-nutrient-protein">{totals.sodium}mg</p>
                <p className="text-xs text-muted-foreground">Sodium</p>
                <p className="text-[10px] text-muted-foreground">/ {profile.sodiumTarget}</p>
              </div>
              <div className="text-center py-2">
                <p className="text-lg font-bold text-nutrient-carbs">{totals.sugar.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Sugar</p>
                <p className="text-[10px] text-muted-foreground">/ {profile.sugarTarget}</p>
              </div>
              <div className="text-center py-2">
                <p className="text-lg font-bold text-nutrient-fat">{totals.satFat.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Sat Fat</p>
                <p className="text-[10px] text-muted-foreground">/ {profile.satFatTarget}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First-run hydration onboarding */}
      <Dialog open={showHydrationModal} onOpenChange={(open) => !open && skipHydrationSetup()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How much do you usually hydrate per day?</DialogTitle>
            <DialogDescription>
              Enter your typical daily intake. We'll use this as your hydration target — you can change it later in Settings.
            </DialogDescription>
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
              <option value="glasses">Glasses (250 ml)</option>
              <option value="litres">Litres</option>
              <option value="ml">Millilitres</option>
              <option value="oz">Ounces (fl oz)</option>
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
              Skip
            </button>
            <button
              onClick={saveHydrationTarget}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Save target
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
