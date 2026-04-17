import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Image, Edit3, Lightbulb, Sun, UtensilsCrossed, Moon, Coffee, X, Loader2, Package, AlertTriangle, RefreshCw, ChevronDown, MessageSquare, Send, Mic, MicOff } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { saveMeal, getTodayString, type MealEntry } from "@/lib/nutrition-store";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const mealTypes = [
  { value: "breakfast" as const, label: "Breakfast", icon: Sun },
  { value: "lunch" as const, label: "Lunch", icon: UtensilsCrossed },
  { value: "dinner" as const, label: "Dinner", icon: Moon },
  { value: "snack" as const, label: "Snack", icon: Coffee },
];

const portionOptions = ["Small", "Medium", "Large", "Extra Large"];

const speechLanguages = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ur-IN", label: "اردو (Urdu)" },
];

type DetectionState = "idle" | "analyzing" | "packaged" | "not_food" | "low_confidence" | "done";
type InputMode = "camera" | "describe";

const LogMeal = () => {
  const [selectedMeal, setSelectedMeal] = useState<MealEntry["mealType"]>("lunch");
  const [showManual, setShowManual] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sodium, setSodium] = useState("");
  const [sugar, setSugar] = useState("");
  const [satFat, setSatFat] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [portionUnit, setPortionUnit] = useState("g");
  const [selectedPortion, setSelectedPortion] = useState("Medium");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectionState, setDetectionState] = useState<DetectionState>("idle");
  const [detectedName, setDetectedName] = useState("");
  const [detectionMessage, setDetectionMessage] = useState("");
  const [isSecondScan, setIsSecondScan] = useState(false);
  const [describeMode, setDescribeMode] = useState(false);
  const [textDescription, setTextDescription] = useState("");
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState("en-US");
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const labelScanRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const autoFillForm = useCallback((data: any) => {
    setFoodName(data.name || "");
    setCalories(String(data.calories || 0));
    setProtein(String(data.protein || 0));
    setCarbs(String(data.carbs || 0));
    setFat(String(data.fat || 0));
    setFiber(String(data.fiber || 0));
    setSodium(String(data.sodium || 0));
    setSugar(String(data.sugar || 0));
    setSatFat(String(data.satFat || 0));
    setShowManual(true);
  }, []);

  const handleAnalyze = useCallback(async (base64: string) => {
    setDetectionState("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data.error) {
        toast({ title: "Analysis failed", description: data.error, variant: "destructive" });
        setDetectionState("idle");
        return;
      }

      const { foodType, confidence, message } = data;

      // Low confidence — ask for clearer photo
      if (confidence < 0.5) {
        setDetectionMessage("We're not sure what this is. Try taking a clearer photo.");
        setDetectionState("low_confidence");
        return;
      }

      switch (foodType) {
        case "not_food":
          setDetectionMessage(message || "This doesn't appear to be a food item.");
          setDetectionState("not_food");
          break;

        case "packaged_food":
          if (isSecondScan) {
            // Second scan still didn't find a label
            setDetectionMessage("We couldn't find a nutritional label. You can enter values manually.");
            setDetectionState("not_food");
            setFoodName(data.name || detectedName);
            setShowManual(true);
          } else {
            setDetectedName(data.name || "Unknown item");
            setDetectionState("packaged");
          }
          break;

        case "nutrition_label":
        case "open_meal":
          autoFillForm(data);
          setDetectionState("done");
          toast({
            title: foodType === "nutrition_label" ? "Label scanned!" : "Meal detected!",
            description: `Detected: ${data.name}`,
          });
          break;

        default:
          setDetectionState("idle");
      }
    } catch (err) {
      console.error("Analyze error:", err);
      toast({ title: "Could not analyze image", description: "Try a clearer photo.", variant: "destructive" });
      setDetectionState("idle");
    }
  }, [toast, autoFillForm, isSecondScan, detectedName]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setDetectionState("idle");
      setIsSecondScan(false);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleLabelScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsSecondScan(true);
      setDetectionState("idle");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Auto-analyze when image changes
  useEffect(() => {
    if (imagePreview && detectionState === "idle") {
      handleAnalyze(imagePreview);
    }
  }, [imagePreview, detectionState]);

  const resetCapture = () => {
    setImagePreview(null);
    setDetectionState("idle");
    setDetectedName("");
    setDetectionMessage("");
    setIsSecondScan(false);
  };

  const handleTextAnalyze = async () => {
    if (!textDescription.trim()) return;
    setIsAnalyzingText(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food-text", {
        body: { description: textDescription.trim(), language: speechLang },
      });
      if (error) throw error;
      if (data.error) {
        toast({ title: "Analysis failed", description: data.error, variant: "destructive" });
        return;
      }
      if (data.foodType === "not_food") {
        toast({ title: "Not a food item", description: data.message || "Try describing a meal.", variant: "destructive" });
        return;
      }
      autoFillForm(data);
      setDescribeMode(false);
      toast({ title: "Meal estimated!", description: `Detected: ${data.name}` });
    } catch (err) {
      console.error("Text analyze error:", err);
      toast({ title: "Could not analyze description", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzingText(false);
    }
  };

  const toggleListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Speech not supported", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;
    recognitionRef.current = recognition;

    let finalTranscript = textDescription;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          setTextDescription(finalTranscript);
        } else {
          interim += transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "aborted") {
        toast({ title: "Voice input error", description: "Please try again or type instead.", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [isListening, textDescription, toast, speechLang]);

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
      sodium: Number(sodium) || 0,
      sugar: Number(sugar) || 0,
      satFat: Number(satFat) || 0,
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
        <p className="text-sm text-muted-foreground mt-1">Take a photo and we'll handle the rest</p>
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
          {/* Loading overlay */}
          {detectionState === "analyzing" && (
            <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-2">
              <Loader2 size={32} className="text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">Analyzing...</span>
            </div>
          )}
          <button
            onClick={resetCapture}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
          >
            <X size={16} className="text-foreground" />
          </button>
          {detectionState === "done" && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium">
              ✓ Detected
            </div>
          )}
        </div>
      ) : null}

      {/* Detection feedback cards */}
      {detectionState === "packaged" && (
        <div className="rounded-xl bg-accent/50 border border-accent p-4 flex gap-3">
          <Package size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              This looks like <span className="text-primary">{detectedName}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Flip it over and take a photo of the nutritional label for accurate values.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => labelScanRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                📸 Scan Label
              </button>
              <button
                onClick={() => {
                  setFoodName(detectedName);
                  setShowManual(true);
                  setDetectionState("done");
                }}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-muted-foreground transition-colors"
              >
                Enter manually
              </button>
            </div>
          </div>
        </div>
      )}

      {(detectionState === "not_food" || detectionState === "low_confidence") && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 flex gap-3">
          <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {detectionState === "not_food" ? "Not a food item" : "Unclear image"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{detectionMessage}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={resetCapture}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw size={12} /> Try again
              </button>
              {showManual && (
                <button
                  onClick={() => setDetectionState("done")}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-muted-foreground transition-colors"
                >
                  Enter manually
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={labelScanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleLabelScan} />

      {/* Camera / Gallery buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-surface flex items-center py-4 hover:border-primary/50 transition-colors">
          <button onClick={() => { setDescribeMode(false); cameraInputRef.current?.click(); }} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Camera size={20} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Camera</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="pr-3 pl-1 self-stretch flex items-center border-l border-border ml-1">
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => { setDescribeMode(false); cameraInputRef.current?.click(); }}>
                <Camera size={14} className="mr-2" /> Take Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDescribeMode(true)}>
                <MessageSquare size={14} className="mr-2" /> Describe Meal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="card-surface flex flex-col items-center gap-2 py-4 hover:border-primary/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Image size={20} className="text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Gallery</span>
        </button>
      </div>

      {/* Describe meal textarea */}
      {describeMode && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Describe what's on your plate (e.g. '2 chapatis, 1 cup dal, small bowl of rice with 1 tsp ghee')"}
              rows={3}
              className="w-full px-3 py-2.5 pr-12 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <button
              onClick={toggleListening}
              type="button"
              className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary/20 text-primary hover:bg-primary/30"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTextAnalyze}
              disabled={isAnalyzingText || !textDescription.trim()}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzingText ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Send size={16} /> Analyze</>
              )}
            </button>
          </div>
        </div>
      )}

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
        <span className="text-xs text-muted-foreground">{detectionState === "done" ? "review & edit values" : "or add manually"}</span>
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
            <input placeholder="Sodium (mg)" value={sodium} onChange={(e) => setSodium(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Sugar (g)" value={sugar} onChange={(e) => setSugar(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Sat. Fat (g)" value={satFat} onChange={(e) => setSatFat(e.target.value)} type="number" className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
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
          <p className="text-sm font-semibold text-warning">Smart Detection</p>
          <p className="text-xs text-muted-foreground mt-1">
            Just snap a photo! We'll automatically detect if it's a meal or packaged food and guide you from there.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogMeal;
