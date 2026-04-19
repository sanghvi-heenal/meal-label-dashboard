import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import StepCard, { type ChoiceOption } from "@/components/onboarding/StepCard";
import {
  getProfile,
  saveProfile,
  type AppJob,
  type Goal,
  type LogPref,
  type PainPoint,
} from "@/lib/nutrition-store";

const goals: ChoiceOption<Goal>[] = [
  { value: "lose_weight", label: "Lose weight", emoji: "⚖️", hint: "Track calories and portions sensibly." },
  { value: "gain_muscle", label: "Gain muscle / strength", emoji: "💪", hint: "Hit protein targets, fuel workouts." },
  { value: "gain_weight", label: "Gain weight (healthy)", emoji: "🍚", hint: "Eat enough, calorie-dense whole foods." },
  { value: "glucose", label: "Monitor glucose / diabetes", emoji: "🩺", hint: "Watch carbs, sugar, and pair with protein." },
  { value: "heart", label: "Heart & cholesterol health", emoji: "❤️", hint: "Lower sodium and saturated fat." },
  { value: "menopause", label: "Menopause support", emoji: "🌸", hint: "Protein, fiber, and bone-friendly foods." },
  { value: "energy_mood", label: "More energy & better mood", emoji: "⚡", hint: "Steady blood sugar, stay hydrated." },
  { value: "eat_healthy", label: "Generally eat healthier", emoji: "🥗", hint: "Balanced meals, no obsessing." },
];

const logPrefs: ChoiceOption<LogPref>[] = [
  { value: "photo", label: "Photo", emoji: "📷", hint: "Snap a picture, AI estimates the rest." },
  { value: "voice", label: "Voice", emoji: "🎤", hint: "Just say what you ate." },
  { value: "text", label: "Typing", emoji: "⌨️", hint: "Type a quick description." },
];

const pains: ChoiceOption<PainPoint>[] = [
  { value: "portions", label: "Portion sizes", emoji: "🍽️" },
  { value: "sugar", label: "Sugar", emoji: "🍬" },
  { value: "carbs", label: "Carbs", emoji: "🍞" },
  { value: "protein", label: "Protein", emoji: "🥩" },
  { value: "drinks", label: "Drinks", emoji: "🥤" },
];

const jobs: ChoiceOption<AppJob>[] = [
  { value: "track", label: "Keep me on track", emoji: "🎯" },
  { value: "teach", label: "Teach me what foods are better", emoji: "🎓" },
  { value: "warn", label: "Warn me about problem meals", emoji: "🚨" },
  { value: "choose", label: "Help me choose drinks/snacks", emoji: "💡" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const profile = getProfile();

  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [logPref, setLogPref] = useState<LogPref[]>(profile.logPrefs);
  const [painPoints, setPainPoints] = useState<PainPoint[]>(profile.painPoints);
  const [appJobs, setAppJobs] = useState<AppJob[]>(profile.appJobs);

  const total = 4;

  const finish = () => {
    saveProfile({
      ...profile,
      goal,
      logPrefs: logPref.length ? logPref : ["photo", "voice", "text"],
      painPoints,
      appJobs: appJobs.length ? appJobs : ["track"],
      onboardedAt: new Date().toISOString(),
    });
    navigate("/", { replace: true });
  };

  const skip = () => {
    saveProfile({ ...profile, onboardedAt: new Date().toISOString() });
    navigate("/", { replace: true });
  };

  const toggleMulti = <T extends string>(arr: T[], setter: (v: T[]) => void, v: T) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const stepValid = () => {
    if (step === 0) return Boolean(goal);
    if (step === 1) return logPref.length > 0;
    if (step === 2) return true; // pain points optional
    if (step === 3) return appJobs.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen px-4 pt-8 pb-32 max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Welcome</span>
        </div>
        <button
          onClick={skip}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Skip
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
          <StepCard
            step={1}
            total={total}
            title="What do you want help with most?"
            subtitle="We'll personalize the app around this."
            options={goals}
            selected={[goal]}
            onToggle={(v) => setGoal(v)}
          />
        )}
        {step === 1 && (
          <StepCard
            step={2}
            total={total}
            title="How do you prefer logging?"
            subtitle="We'll put your favorite method first."
            options={logPrefs}
            selected={logPref}
            onToggle={(v) => toggleMulti(logPref, setLogPref, v)}
            multi
          />
        )}
        {step === 2 && (
          <StepCard
            step={3}
            total={total}
            title="What confuses you most?"
            subtitle="We'll explain these in plain English when they show up in your meals."
            options={pains}
            selected={painPoints}
            onToggle={(v) => toggleMulti(painPoints, setPainPoints, v)}
            multi
          />
        )}
        {step === 3 && (
          <StepCard
            step={4}
            total={total}
            title="What do you want the app to do?"
            subtitle="This shapes the tone of your daily summary."
            options={jobs}
            selected={appJobs}
            onToggle={(v) => toggleMulti(appJobs, setAppJobs, v)}
            multi
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
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <button
          onClick={() => (step < total - 1 ? setStep((s) => s + 1) : finish())}
          disabled={!stepValid()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {step < total - 1 ? (
            <>
              Continue <ArrowRight size={16} />
            </>
          ) : (
            <>
              Finish <Sparkles size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
