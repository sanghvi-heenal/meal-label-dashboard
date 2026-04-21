interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
}

const CalorieRing = ({ consumed, target, size = 120 }: CalorieRingProps) => {
  const percentage = Math.min((consumed / target) * 100, 100);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Color thresholds:
  // - up to 2000 kcal: green
  // - 2000–3000 kcal: yellow (warning)
  // - above 3000 kcal: red (over)
  let ringColor = "hsl(var(--primary))"; // green
  if (consumed > 3000) {
    ringColor = "hsl(var(--over-target))";
  } else if (consumed > 2000) {
    ringColor = "hsl(var(--warning))";
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default CalorieRing;
