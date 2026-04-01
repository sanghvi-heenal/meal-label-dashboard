import CalorieRing from "@/components/CalorieRing";
import MacroBar from "@/components/MacroBar";
import { getGreeting, getMealsByDate, getProfile, getTodayString } from "@/lib/nutrition-store";

const Dashboard = () => {
  const profile = getProfile();
  const todayMeals = getMealsByDate(getTodayString());

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

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}</h1>
          <p className="text-sm text-muted-foreground">Today</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-info/20 text-info">
          ⚖ BMI {profile.bmi}
        </span>
      </div>

      {/* Calories Card */}
      <div className="card-surface space-y-4">
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

      {/* Macros Card */}
      <div className="card-surface space-y-4">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Macronutrients
        </h2>
        <MacroBar label="Protein" current={totals.protein} goal={profile.proteinTarget} unit="g" colorClass="text-nutrient-protein" bgClass="bg-nutrient-protein" />
        <MacroBar label="Carbs" current={totals.carbs} goal={profile.carbsTarget} unit="g" colorClass="text-nutrient-carbs" bgClass="bg-nutrient-carbs" />
        <MacroBar label="Fat" current={totals.fat} goal={profile.fatTarget} unit="g" colorClass="text-nutrient-fat" bgClass="bg-nutrient-fat" />
        <MacroBar label="Fiber" current={totals.fiber} goal={profile.fiberTarget} unit="g" colorClass="text-nutrient-fiber" bgClass="bg-nutrient-fiber" />
      </div>

      {/* Quick Stats */}
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
  );
};

export default Dashboard;
