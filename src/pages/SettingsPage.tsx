import { useState } from "react";
import { User, Bell, Target, Info, Pencil, Droplets } from "lucide-react";
import { formatHydration, getProfile, mlToUnit, saveProfile, type HydrationUnit, type UserProfile } from "@/lib/nutrition-store";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [editing, setEditing] = useState(false);
  const [editingHydration, setEditingHydration] = useState(false);
  const [hydrationAmount, setHydrationAmount] = useState(String(mlToUnit(profile.hydrationTarget, profile.hydrationUnit)));
  const [hydrationUnit, setHydrationUnit] = useState<HydrationUnit>(profile.hydrationUnit);
  const { toast } = useToast();

  const update = (partial: Partial<UserProfile>) => {
    const next = { ...profile, ...partial };
    setProfile(next);
    saveProfile(next);
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
    // Re-convert current input from old unit → ml → new unit so the value stays meaningful
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
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    let ml = n;
    if (hydrationUnit === "glasses") ml = Math.round(n * 250);
    else if (hydrationUnit === "litres") ml = Math.round(n * 1000);
    else if (hydrationUnit === "oz") ml = Math.round(n * 29.5735);
    else ml = Math.round(n);

    if (ml < MIN_ML) {
      toast({
        title: "Target too low",
        description: "Minimum hydration target is 1 L (1000 ml / 4 glasses / 34 fl oz).",
        variant: "destructive",
      });
      return;
    }

    // Persist BOTH the canonical ml target AND the user's preferred display unit
    update({ hydrationTarget: ml, hydrationUnit });
    setEditingHydration(false);
    toast({ title: "Hydration target updated", description: formatHydration(ml, hydrationUnit) });
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile Card */}
      <div className="card-surface flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <User size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">Your Profile</p>
          <p className="text-xs text-muted-foreground truncate">
            Age {profile.age} · {profile.dietType} · BMI {profile.bmi}
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Age</label>
              <input type="number" value={profile.age} onChange={(e) => update({ age: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">BMI</label>
              <input type="number" value={profile.bmi} onChange={(e) => update({ bmi: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Diet Type</label>
            <select value={profile.dietType} onChange={(e) => update({ dietType: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Balanced</option>
              <option>Vegetarian (no meat)</option>
              <option>Vegan</option>
              <option>Keto</option>
              <option>Paleo</option>
            </select>
          </div>
          <button onClick={() => { setEditing(false); toast({ title: "Profile saved!" }); }} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Save
          </button>
        </div>
      )}

      {/* Meal Reminders */}
      <div className="card-surface space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Meal Reminders</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Daily Reminders</p>
            <p className="text-xs text-muted-foreground">Get notified 3 times a day to log meals</p>
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
                <span className="text-sm text-foreground capitalize">{key}</span>
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
          <h2 className="font-semibold text-foreground">Daily Nutrition Targets</h2>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Diet type</span>
          <span className="font-medium text-foreground">{profile.dietType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">BMI</span>
          <span className="font-medium text-foreground">{profile.bmi}</span>
        </div>

        {/* Hydration target row */}
        <div className="pt-2 mt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets size={14} className="text-info" />
              <span className="text-sm text-muted-foreground">Daily hydration</span>
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
                  <option value="glasses">Glasses (250ml)</option>
                  <option value="litres">Litres</option>
                  <option value="oz">fl oz</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 1 L (1000 ml / 4 glasses / 34 fl oz).
              </p>
              <button
                onClick={saveHydration}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Save target
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          Your daily nutrition targets are automatically calculated based on your age, diet type, and BMI. Update your profile to adjust.
        </p>
      </div>

      {/* About */}
      <div className="card-surface space-y-2">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">About NutriLens</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          NutriLens helps you track your meals and understand your nutrition. All data is stored locally on your device.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
