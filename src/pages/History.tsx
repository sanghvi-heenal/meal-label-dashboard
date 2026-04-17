import { useState } from "react";
import { ChevronLeft, ChevronRight, UtensilsCrossed, Plus } from "lucide-react";
import { getMealsByDate } from "@/lib/nutrition-store";
import { useNavigate } from "react-router-dom";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const History = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const dateStr = selectedDate.toISOString().split("T")[0];
  const meals = getMealsByDate(dateStr);

  // Earliest loggable date = 6 days ago (so today + past 6 days = past week)
  const minLogDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (d: number) =>
    d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

  const isDisabled = (d: number) => {
    const cellDate = new Date(year, month, d);
    return cellDate < minLogDate || cellDate > today;
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Food History</h1>

      {/* Calendar */}
      <div className="card-surface">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-foreground">
            {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS.map((d) => (
            <div key={d} className="text-xs text-muted-foreground py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(new Date(year, month, d))}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected(d)
                  ? "bg-primary text-primary-foreground"
                  : isToday(d)
                  ? "text-primary"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Selected day label */}
      <div className="flex items-center gap-2 text-primary">
        <span className="text-sm">📅</span>
        <span className="font-semibold text-sm">
          {isToday(selectedDate.getDate()) && month === selectedDate.getMonth() && year === selectedDate.getFullYear()
            ? "Today"
            : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Meals list */}
      {meals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <UtensilsCrossed size={40} className="text-muted-foreground" />
          <p className="font-semibold text-foreground">No meals logged</p>
          <p className="text-sm text-muted-foreground">Add a meal to this date or use the Log tab for today</p>
          <button
            onClick={() => navigate("/log")}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <Plus size={14} /> Add Meal to This Date
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <div key={meal.id} className="card-surface flex justify-between items-center">
              <div>
                <p className="font-medium text-foreground text-sm">{meal.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{meal.mealType}</p>
              </div>
              <span className="text-sm font-semibold text-warning">{meal.calories} kcal</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
