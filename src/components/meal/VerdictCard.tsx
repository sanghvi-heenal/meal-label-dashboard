import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { MealVerdict } from "@/lib/insights";

const toneStyle = {
  good: { icon: CheckCircle2, ring: "border-primary/40 bg-primary/10", iconColor: "text-primary", label: "text-primary" },
  watch: { icon: AlertTriangle, ring: "border-warning/40 bg-warning/10", iconColor: "text-warning", label: "text-warning" },
  neutral: { icon: Info, ring: "border-border bg-secondary", iconColor: "text-muted-foreground", label: "text-foreground" },
} as const;

interface VerdictCardProps {
  verdict: MealVerdict;
}

const VerdictCard = ({ verdict }: VerdictCardProps) => {
  const s = toneStyle[verdict.tone];
  const Icon = s.icon;
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${s.ring}`}>
      <div className="flex items-start gap-2">
        <Icon size={18} className={`${s.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${s.label}`}>{verdict.label}</p>
          <p className="text-xs text-foreground/90 mt-1">{verdict.why}</p>
        </div>
      </div>
      {verdict.tip && (
        <div className="pl-6 pt-1 border-t border-border/40">
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-semibold text-foreground">Tip: </span>
            {verdict.tip}
          </p>
        </div>
      )}
    </div>
  );
};

export default VerdictCard;
