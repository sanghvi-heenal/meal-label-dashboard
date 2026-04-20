import { Sparkles } from "lucide-react";

interface GapSummaryProps {
  text: string;
}

const GapSummary = ({ text }: GapSummaryProps) => {
  return (
    <div className="card-surface card-tint-info flex gap-3 items-start">
      <div className="w-9 h-9 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0">
        <Sparkles size={18} className="text-info" />
      </div>
      <p className="text-sm text-foreground leading-relaxed pt-1">{text}</p>
    </div>
  );
};

export default GapSummary;
