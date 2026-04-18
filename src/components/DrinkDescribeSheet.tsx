import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Mic, MicOff, MessageSquare, Loader2, X, Sparkles, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useVoiceTranscription } from "@/hooks/useVoiceTranscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DrinkAnalysisResult {
  name: string;
  volumeMl: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
}

interface DrinkDescribeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: DrinkAnalysisResult) => void;
}

const DrinkDescribeSheet = ({ open, onOpenChange, onConfirm }: DrinkDescribeSheetProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DrinkAnalysisResult | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { transcript, setTranscript, isListening, supported, start, stop, reset } = useVoiceTranscription();
  const { toast } = useToast();

  // Keep text in sync with voice transcript while listening
  useEffect(() => {
    if (transcript && transcript !== text) setText(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const resetAll = () => {
    setPhoto(null);
    setText("");
    setResult(null);
    reset();
    stop();
  };

  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const hasInput = !!photo || !!text.trim();

  const handleAnalyze = async () => {
    if (!hasInput) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const description = text.trim();
      let data: any;
      let error: any;

      if (photo) {
        ({ data, error } = await supabase.functions.invoke("analyze-food", {
          body: { imageBase64: photo, userContext: description || undefined, mode: "drink" },
        }));
      } else {
        ({ data, error } = await supabase.functions.invoke("analyze-food-text", {
          body: { description, language: navigator.language || "en-US", mode: "drink" },
        }));
      }

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Analysis failed", description: data.error, variant: "destructive" });
        return;
      }
      if (data.foodType === "not_food") {
        toast({ title: "Not recognized", description: data.message || "Try a different photo or description.", variant: "destructive" });
        return;
      }

      // Try to pull a volume out of the AI response or fall back to parsing the name
      let volumeMl = Number(data.volumeMl) || 0;
      if (!volumeMl) {
        const m = (data.name || "").match(/(\d+(?:\.\d+)?)\s*ml/i);
        if (m) volumeMl = Math.round(Number(m[1]));
      }
      if (!volumeMl) volumeMl = 250;

      setResult({
        name: data.name || "Drink",
        volumeMl,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        fiber: Number(data.fiber) || 0,
        sodium: Number(data.sodium) || 0,
        sugar: Number(data.sugar) || 0,
        satFat: Number(data.satFat) || 0,
      });
    } catch (err) {
      console.error("Drink analyze error:", err);
      toast({ title: "Could not analyze", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateResult = <K extends keyof DrinkAnalysisResult>(key: K, value: DrinkAnalysisResult[K]) => {
    setResult((r) => (r ? { ...r, [key]: value } : r));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Describe your drink
          </SheetTitle>
        </SheetHeader>

        {!result && (
          <div className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground">
              Use any combination — snap a photo, speak it, or type. We'll estimate the nutrition for you.
            </p>

            {/* Photo tile */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">📷 Photo</label>
              {photo ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={photo} alt="Drink" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X size={14} className="text-foreground" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  >
                    <Camera size={20} className="text-primary" />
                    <span className="text-xs font-medium text-foreground">Take photo</span>
                  </button>
                  <button
                    onClick={() => galleryRef.current?.click()}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  >
                    <ImageIcon size={20} className="text-primary" />
                    <span className="text-xs font-medium text-foreground">Upload</span>
                  </button>
                </div>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            {/* Voice + Text combined (voice fills the textarea) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                  <MessageSquare size={12} /> Describe / 🎤 Voice
                </label>
                {supported && (
                  <button
                    onClick={start}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isListening
                        ? "bg-destructive/15 text-destructive animate-pulse"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {isListening ? <><MicOff size={12} /> Stop</> : <><Mic size={12} /> Speak</>}
                  </button>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setTranscript(e.target.value);
                }}
                placeholder="e.g. a glass of fresh sugarcane juice with lemon, about 300ml"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              {!supported && (
                <p className="text-[11px] text-muted-foreground">
                  Voice input isn't supported on this browser — type your description instead.
                </p>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!hasInput || isAnalyzing}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles size={16} /> Analyze drink</>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4 mt-4">
            <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-start gap-2">
              <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                Estimated values — review and tweak before saving.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                value={result.name}
                onChange={(e) => updateResult("name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Volume (ml)</label>
                <input
                  type="number"
                  value={result.volumeMl}
                  onChange={(e) => updateResult("volumeMl", Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Calories</label>
                <input
                  type="number"
                  value={result.calories}
                  onChange={(e) => updateResult("calories", Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Sugar (g)</label>
                <input
                  type="number"
                  value={result.sugar}
                  onChange={(e) => updateResult("sugar", Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Protein (g)</label>
                <input
                  type="number"
                  value={result.protein}
                  onChange={(e) => updateResult("protein", Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Carbs (g)</label>
                <input
                  type="number"
                  value={result.carbs}
                  onChange={(e) => updateResult("carbs", Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fat (g)</label>
                <input
                  type="number"
                  value={result.fat}
                  onChange={(e) => updateResult("fat", Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:border-muted-foreground transition-colors"
              >
                Re-do
              </button>
              <button
                onClick={() => result && onConfirm(result)}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} /> Save drink
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DrinkDescribeSheet;
