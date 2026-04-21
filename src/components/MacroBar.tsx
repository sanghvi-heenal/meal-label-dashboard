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
  const rawPct = goal > 0 ? (current / goal) * 100 : 0;
  const pct = Math.min(rawPct, 100);
  const isOver = rawPct > 100;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const valueColor = isOver ? "text-[hsl(var(--over-target))]" : colorClass;
  const barColor = isOver ? "bg-[hsl(var(--over-target))]" : bgClass;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <span className="text-sm">
          <span className={`font-bold ${valueColor}`}>{current}</span>
          <span className="text-muted-foreground"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {Math.round(rawPct)}% of daily goal{isOver ? " — over target" : ""}
      </p>
    </div>
  );
};

export default MacroBar;
