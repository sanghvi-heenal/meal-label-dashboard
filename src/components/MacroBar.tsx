import { useEffect, useState } from "react";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  colorClass: string;
  bgClass: string;
}

const MacroBar = ({ label, current, goal, unit, colorClass, bgClass }: MacroBarProps) => {
  const pct = Math.min((current / goal) * 100, 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <span className="text-sm">
          <span className={`font-bold ${colorClass}`}>{current}</span>
          <span className="text-muted-foreground"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${bgClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{Math.round(pct)}% of daily goal</p>
    </div>
  );
};

export default MacroBar;
