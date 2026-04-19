import { Sun } from "lucide-react";

interface SummaryCardProps {
  headline: string;
  sub: string;
}

const SummaryCard = ({ headline, sub }: SummaryCardProps) => {
  return (
    <div className="card-surface card-tint-warning">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sun size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground leading-snug">{headline}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
