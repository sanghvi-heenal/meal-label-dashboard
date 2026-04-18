import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CalorieRing from "@/components/CalorieRing";
import HydrationRing from "@/components/HydrationRing";
import MacroBar from "@/components/MacroBar";
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
  getGreeting,
  getHydrationFromMeals,
  getMealsByDate,
  getProfile,
  getTodayString,
  saveProfile,
} from "@/lib/nutrition-store";

const HYDRATION_ONBOARDED_KEY = "nutrilens-hydration-onboarded";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getProfile());
  const [statsTab, setStatsTab] = useState<"calories" | "drinks">("calories");
  const todayMeals = getMealsByDate(getTodayString());

  // First-run hydration onboarding
  const [showHydrationModal, setShowHydrationModal] = useState(false);
  const [hydrationAmount, setHydrationAmount] = useState("8");
  const [hydrationUnit, setHydrationUnit] = useState<"glasses" | "litres" | "oz">("glasses");

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
      else ml = Math.round(n * 29.5735);
    }
    const next = { ...profile, hydrationTarget: ml };
    saveProfile(next);
    setProfile(next);
    localStorage.setItem(HYDRATION_ONBOARDED_KEY, "1");
    setShowHydrationModal(false);
  };

  const skipHydrationSetup = () => {
    localStorage.setItem(HYDRATION_ONBOARDED_KEY, "1");
    setShowHydrationModal(false);
  };

  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fiber: acc.fiber + m.fiber,
      sodium: acc.sodium + m.sodium,
      sugar: acc.sugar + m.sugar,
      satFat: acc.satFat + m.satFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, satFat: 0 }
  );

  const remaining = Math.max(profile.calorieTarget - totals.calories, 0);
  const hydrationMl = getHydrationFromMeals(todayMeals);
  const hydrationRemaining = Math.max(profile.hydrationTarget - hydrationMl, 0);

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "0ms" }}>
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

      {/* Calories / Drinks toggle + card */}
      <div className="space-y-3 animate-fade-in" style={{ animationDelay: "80ms" }}>
        <div className="relative grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary border border-border">
          {/* Sliding active pill */}
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg shadow transition-transform duration-300 ease-out ${
              statsTab === "calories" ? "bg-warning translate-x-0" : "bg-info translate-x-[calc(100%+0.5rem)]"
            }`}
            aria-hidden="true"
          />
          <button
            onClick={() => setStatsTab("calories")}
            className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statsTab === "calories" ? "text-warning-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔥 Calories
          </button>
          <button
            onClick={() => setStatsTab("drinks")}
            className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statsTab === "drinks" ? "text-info-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            💧 Drinks
          </button>
        </div>

        {statsTab === "calories" ? (
          <div className="card-surface space-y-4 animate-fade-in">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Today's Calories
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{totals.calories}</span>
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
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Target</span>
                  <span className="ml-auto font-semibold text-primary">{profile.calorieTarget} kcal</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-surface space-y-4 animate-fade-in">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Today's Hydration
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{hydrationMl}</span>
              <span className="text-muted-foreground text-sm">/ {profile.hydrationTarget} ml</span>
            </div>
            <div className="flex items-center gap-6">
              <HydrationRing consumed={hydrationMl} target={profile.hydrationTarget} size={120} />
              <div className="space-y-2 text-sm flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-info" />
                  <span className="text-muted-foreground">Consumed</span>
                  <span className="ml-auto font-semibold text-info">{hydrationMl} ml</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="ml-auto font-semibold text-foreground">{hydrationRemaining} ml</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Target</span>
                  <span className="ml-auto font-semibold text-primary">{profile.hydrationTarget} ml</span>
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
        )}
      </div>

      {/* Macros Card */}
      <div className="card-surface space-y-4 animate-fade-in" style={{ animationDelay: "160ms" }}>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Macronutrients
        </h2>
        <MacroBar label="Protein" current={totals.protein} goal={profile.proteinTarget} unit="g" colorClass="text-nutrient-protein" bgClass="bg-nutrient-protein" />
        <MacroBar label="Carbs" current={totals.carbs} goal={profile.carbsTarget} unit="g" colorClass="text-nutrient-carbs" bgClass="bg-nutrient-carbs" />
        <MacroBar label="Fat" current={totals.fat} goal={profile.fatTarget} unit="g" colorClass="text-nutrient-fat" bgClass="bg-nutrient-fat" />
        <MacroBar label="Fiber" current={totals.fiber} goal={profile.fiberTarget} unit="g" colorClass="text-nutrient-fiber" bgClass="bg-nutrient-fiber" />
      </div>

      {/* Quick Stats */}
      <div className="card-surface animate-fade-in" style={{ animationDelay: "240ms" }}>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="text-center py-2 hover-scale cursor-default">
            <p className="text-lg font-bold text-nutrient-protein">{totals.sodium}mg</p>
            <p className="text-xs text-muted-foreground">Sodium</p>
            <p className="text-[10px] text-muted-foreground">/ {profile.sodiumTarget}</p>
          </div>
          <div className="text-center py-2 hover-scale cursor-default">
            <p className="text-lg font-bold text-nutrient-carbs">{totals.sugar.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground">Sugar</p>
            <p className="text-[10px] text-muted-foreground">/ {profile.sugarTarget}</p>
          </div>
          <div className="text-center py-2 hover-scale cursor-default">
            <p className="text-lg font-bold text-nutrient-fat">{totals.satFat.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground">Sat Fat</p>
            <p className="text-[10px] text-muted-foreground">/ {profile.satFatTarget}</p>
          </div>
        </div>
      </div>

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
              onChange={(e) => setHydrationUnit(e.target.value as typeof hydrationUnit)}
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="glasses">Glasses (250 ml)</option>
              <option value="litres">Litres</option>
              <option value="oz">Ounces (fl oz)</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            ≈ {(() => {
              const n = Number(hydrationAmount);
              if (!n) return "0 ml";
              if (hydrationUnit === "glasses") return `${Math.round(n * 250)} ml`;
              if (hydrationUnit === "litres") return `${Math.round(n * 1000)} ml`;
              return `${Math.round(n * 29.5735)} ml`;
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
