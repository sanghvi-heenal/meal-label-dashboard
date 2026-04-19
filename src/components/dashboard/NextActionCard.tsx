import { Target } from "lucide-react";

interface NextActionCardProps {
  action: string;
  onLog?: () => void;
}

const NextActionCard = ({ action, onLog }: NextActionCardProps) => (
  <div className="card-surface card-tint-info space-y-3">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-info/20 flex items-center justify-center shrink-0">
        <Target size={18} className="text-info" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Next action
        </p>
        <p className="text-sm text-foreground mt-1 leading-snug">{action}</p>
      </div>
    </div>
    {onLog && (
      <button
        onClick={onLog}
        className="w-full py-2 rounded-lg bg-info/10 hover:bg-info/20 border border-info/30 text-info text-xs font-semibold transition-colors active:scale-95"
      >
        Log a meal
      </button>
    )}
  </div>
);

export default NextActionCard;
