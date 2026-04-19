import { Check, Languages } from "lucide-react";
import type { Language } from "@/i18n";

interface LanguagePickerProps {
  value: Language;
  onChange: (lang: Language) => void;
}

const options: { value: Language; label: string; sub: string }[] = [
  { value: "en", label: "English", sub: "Use the app in English" },
  { value: "hi", label: "हिन्दी", sub: "ऐप हिन्दी में इस्तेमाल करें" },
];

const LanguagePicker = ({ value, onChange }: LanguagePickerProps) => {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              sel ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Languages size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-base ${sel ? "text-primary" : "text-foreground"}`}>
                {opt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
            </div>
            <div
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                sel ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {sel && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LanguagePicker;
