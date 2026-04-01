import { useState, useRef } from "react";
import { Camera, Image, Edit3, Lightbulb, Sun, UtensilsCrossed, Moon, Coffee, X } from "lucide-react";
import { saveMeal, getTodayString, type MealEntry } from "@/lib/nutrition-store";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mealTypes = [
  { value: "breakfast" as const, label: "Breakfast", icon: Sun },
  { value: "lunch" as const, label: "Lunch", icon: UtensilsCrossed },
  { value: "dinner" as const, label: "Dinner", icon: Moon },
  { value: "snack" as const, label: "Snack", icon: Coffee },
];

const portionOptions = ["Small", "Medium", "Large", "Extra Large"];

const LogMeal = () => {
  const [selectedMeal, setSelectedMeal] = useState<MealEntry["mealType"]>("lunch");
  const [showManual, setShowManual] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [portionUnit, setPortionUnit] = useState("g");
  const [selectedPortion, setSelectedPortion] = useState("Medium");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!foodName.trim()) {
      toast({ title: "Please enter a food name", variant: "destructive" });
      return;
    }
    const entry: MealEntry = {
      id: crypto.randomUUID(),
      date: getTodayString(),
      mealType: selectedMeal,
      name: foodName + (portionSize ? ` (${portionSize}${portionUnit}, ${selectedPortion})` : ` (${selectedPortion})`),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      sodium: 0,
      sugar: 0,
      satFat: 0,
      timestamp: Date.now(),
    };
    saveMeal(entry);
    toast({ title: "Meal logged!", description: `${foodName} added to ${selectedMeal}` });
    navigate("/");
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Log a Meal</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your food intake</p>
      </div>

      {/* Meal type selector */}
      <div className="flex flex-wrap gap-2">
        {mealTypes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSelectedMeal(value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              selectedMeal === value
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Image upload area */}
      {imagePreview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={imagePreview} alt="Food" className="w-full h-48 object-cover" />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
          >
            <X size={16} className="text-foreground" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2">
          <Camera size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No image selected</p>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      {/* Camera / Gallery buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => cameraInputRef.current?.click()} className="card-surface flex flex-col items-center gap-2 py-4 hover:border-primary/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Camera size={20} className="text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Camera</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="card-surface flex flex-col items-center gap-2 py-4 hover:border-primary/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Image size={20} className="text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Gallery</span>
        </button>
      </div>

      {/* Portion size */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Portion Size</label>
        <div className="flex flex-wrap gap-2">
          {portionOptions.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPortion(p)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                selectedPortion === p
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Amount (optional)"
            value={portionSize}
            onChange={(e) => setPortionSize(e.target.value)}
            type="number"
            className="flex-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={portionUnit}
            onChange={(e) => setPortionUnit(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="g">g</option>
            <option value="oz">oz</option>
            <option value="ml">ml</option>
            <option value="cups">cups</option>
            <option value="pieces">pcs</option>
          </select>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or add manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual entry */}
      {!showManual ? (
        <button
          onClick={() => setShowManual(true)}
          className="w-full card-surface flex items-center justify-center gap-2 py-3 hover:border-primary/50 transition-colors"
        >
          <Edit3 size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Type food name manually</span>
        </button>
      ) : (
        <div className="space-y-3">
          <input
            placeholder="Food name (e.g. Grilled chicken)"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Calories (kcal)" value={calories} onChange={(e) => setCalories(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Protein (g)" value={protein} onChange={(e) => setProtein(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Carbs (g)" value={carbs} onChange={(e) => setCarbs(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Fat (g)" value={fat} onChange={(e) => setFat(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Fiber (g)" value={fiber} onChange={(e) => setFiber(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Save Meal
          </button>
        </div>
      )}

      {/* Tip */}
      <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 flex gap-3">
        <Lightbulb size={20} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning">Tip: Better Analysis</p>
          <p className="text-xs text-muted-foreground mt-1">
            For best results, place your food on a plate or bowl and take the photo from above. Include all items in the frame.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogMeal;
