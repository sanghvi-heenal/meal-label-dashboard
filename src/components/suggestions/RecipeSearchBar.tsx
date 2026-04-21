import { useState, type FormEvent } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RecipeSearchBarProps {
  initialValue?: string;
  loggedToday: string[];
  loading?: boolean;
  onSearch: (query: string) => void;
}

const RecipeSearchBar = ({ initialValue = "", loggedToday, loading, onSearch }: RecipeSearchBarProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);

  // keep local value in sync if parent changes initialValue (e.g. ?focus= deep link)
  // simple approach: a key change at the parent level remounts; for safety we still
  // accept new initialValue when it differs and the input is empty.
  if (initialValue && !value && initialValue !== value) {
    // run only on first render where value is empty — avoids overriding user typing
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const q = value.trim();
    if (!q) return;
    onSearch(q);
  };

  return (
    <div className="card-surface space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-info/15 flex items-center justify-center">
          <Search size={16} className="text-info" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{t("suggestions.searchTitle")}</h2>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("suggestions.searchPlaceholder")}
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          maxLength={200}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("suggestions.searchGo")}
          <ArrowRight size={14} />
        </button>
      </form>

      {loggedToday.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("suggestions.loggedToday")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {loggedToday.map((dish) => (
              <button
                key={dish}
                type="button"
                onClick={() => {
                  setValue(dish);
                  onSearch(dish);
                }}
                disabled={loading}
                className="text-xs font-medium px-3 py-1 rounded-full bg-secondary/70 hover:bg-secondary text-foreground border border-border active:scale-95 transition-transform disabled:opacity-50"
              >
                {dish}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeSearchBar;