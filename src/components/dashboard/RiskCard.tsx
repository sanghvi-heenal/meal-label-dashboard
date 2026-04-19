import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RiskCardProps {
  risk: { label: string; detail: string; severity: "ok" | "watch" | "high" } | null;
}

const RiskCard = ({ risk }: RiskCardProps) => {
  const { t } = useTranslation();
  if (!risk) {
    return (
      <div className="card-surface flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{t("risk.noFlags")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("risk.noFlagsSub")}</p>
        </div>
      </div>
    );
  }

  const isHigh = risk.severity === "high";
  const tintClass = isHigh ? "card-tint-warning" : "";
  const iconBg = isHigh ? "bg-destructive/20" : "bg-warning/20";
  const iconColor = isHigh ? "text-destructive" : "text-warning";

  return (
    <div className={`card-surface ${tintClass} flex items-start gap-3`}>
      <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        <AlertTriangle size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{risk.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{risk.detail}</p>
      </div>
    </div>
  );
};

export default RiskCard;
