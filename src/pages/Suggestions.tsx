import { useEffect, useState, useCallback, useMemo } from "react";
import { Lightbulb, RefreshCw, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  getMealsByDate,
  getProfile,
  getTodayString,
} from "@/lib/nutrition-store";
import { sumTotals } from "@/lib/insights";
import GapSummary from "@/components/suggestions/GapSummary";
import SuggestionCard, { type Suggestion } from "@/components/suggestions/SuggestionCard";
import RecipeSearchBar from "@/components/suggestions/RecipeSearchBar";
import SwapCard, { type RecipeSwap } from "@/components/suggestions/SwapCard";
import { toast } from "@/hooks/use-toast";

interface SuggestionsResponse {
  gapSummary: string;
  suggestions: Suggestion[];
}

const CACHE_KEY = "nutrilens-suggestions-cache";
const SEARCH_CACHE_KEY = "nutrilens-recipe-search-cache";
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry {
  date: string;
  mealCount: number;
  data: SuggestionsResponse;
}

const readCache = (date: string, mealCount: number): SuggestionsResponse | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.date === date && entry.mealCount === mealCount) return entry.data;
    return null;
  } catch {
    return null;
  }
};

const writeCache = (date: string, mealCount: number, data: SuggestionsResponse) => {
  const entry: CacheEntry = { date, mealCount, data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
};

interface SearchCacheEntry {
  query: string;
  dietType: string;
  ts: number;
  results: RecipeSwap[];
}
type SearchCacheMap = Record<string, SearchCacheEntry>;

const normalizeQuery = (q: string) => q.trim().toLowerCase().replace(/\s+/g, " ");
const buildSearchKey = (query: string, dietType: string) =>
  `${normalizeQuery(query)}::${dietType}`;

const readSearchCache = (query: string, dietType: string): RecipeSwap[] | null => {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as SearchCacheMap;
    const entry = map[buildSearchKey(query, dietType)];
    if (!entry) return null;
    if (Date.now() - entry.ts > SEARCH_CACHE_TTL_MS) return null;
    return entry.results;
  } catch {
    return null;
  }
};

const writeSearchCache = (query: string, dietType: string, results: RecipeSwap[]) => {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    const map: SearchCacheMap = raw ? (JSON.parse(raw) as SearchCacheMap) : {};
    map[buildSearchKey(query, dietType)] = {
      query: normalizeQuery(query),
      dietType,
      ts: Date.now(),
      results,
    };
    // cap at ~30 entries to keep localStorage small
    const keys = Object.keys(map);
    if (keys.length > 30) {
      const sorted = keys
        .map((k) => ({ k, ts: map[k].ts }))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 30)
        .map((x) => x.k);
      const trimmed: SearchCacheMap = {};
      sorted.forEach((k) => (trimmed[k] = map[k]));
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(map));
    }
  } catch {
    // ignore quota errors
  }
};

const Suggestions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSwap[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<string>("");

  const today = getTodayString();
  const meals = getMealsByDate(today);
  const profile = getProfile();
  const totals = sumTotals(meals);

  // Strip "(Medium)" / "(150g, Medium)" suffix from logged names for cleaner chips/search.
  const cleanMealName = useCallback((name: string) => {
    return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  }, []);

  const loggedTodayChips = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const m of meals) {
      if (m.mealType === "drink") continue;
      const cleaned = cleanMealName(m.name);
      const key = cleaned.toLowerCase();
      if (cleaned && !seen.has(key)) {
        seen.add(key);
        result.push(cleaned);
      }
      if (result.length >= 6) break;
    }
    return result;
  }, [meals, cleanMealName]);

  const remaining = {
    calories: Math.max(profile.calorieTarget - totals.calories, 0),
    protein: Math.max(profile.proteinTarget - totals.protein, 0),
    carbs: Math.max(profile.carbsTarget - totals.carbs, 0),
    fat: Math.max(profile.fatTarget - totals.fat, 0),
    fiber: Math.max(profile.fiberTarget - totals.fiber, 0),
  };

  const fetchSuggestions = useCallback(
    async (forceRefresh = false) => {
      if (meals.length === 0) return;
      if (!forceRefresh) {
        const cached = readCache(today, meals.length);
        if (cached) {
          setData(cached);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const { data: resp, error: fnError } = await supabase.functions.invoke("suggest-meals", {
          body: {
            meals: meals.map((m) => ({
              name: m.name,
              mealType: m.mealType,
              calories: m.calories,
              protein: m.protein,
              carbs: m.carbs,
              fat: m.fat,
              fiber: m.fiber,
            })),
            remaining,
            dietType: profile.dietType,
            goals: profile.goals,
            language: profile.language,
          },
        });

        if (fnError) throw fnError;
        if (!resp || (resp as { error?: string }).error) {
          throw new Error((resp as { error?: string })?.error || "Failed to load suggestions");
        }

        const result = resp as SuggestionsResponse;
        setData(result);
        writeCache(today, meals.length, result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setError(msg);
        toast({ title: t("suggestions.errorTitle"), description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meals.length, today],
  );

  useEffect(() => {
    fetchSuggestions(false);
  }, [fetchSuggestions]);

  const runSearch = useCallback(
    async (query: string, forceRefresh = false) => {
      const q = query.trim();
      if (!q) return;
      setActiveQuery(q);
      setSearchError(null);

      if (!forceRefresh) {
        const cached = readSearchCache(q, profile.dietType);
        if (cached) {
          setSearchResults(cached);
          return;
        }
      }

      setSearchLoading(true);
      setSearchResults(null);
      try {
        const { data: resp, error: fnError } = await supabase.functions.invoke(
          "search-healthier-recipes",
          {
            body: {
              query: q,
              dietType: profile.dietType,
              goals: profile.goals,
              painPoints: profile.painPoints,
              language: profile.language,
            },
          },
        );
        if (fnError) throw fnError;
        if (!resp || (resp as { error?: string }).error) {
          throw new Error((resp as { error?: string })?.error || "Search failed");
        }
        const results = (resp as { results: RecipeSwap[] }).results || [];
        setSearchResults(results);
        if (results.length > 0) writeSearchCache(q, profile.dietType, results);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setSearchError(msg);
        toast({ title: t("suggestions.errorTitle"), description: msg, variant: "destructive" });
      } finally {
        setSearchLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.dietType, profile.language, t],
  );

  // Handle ?focus=<dish> deep link from the post-log toast.
  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus && focus.trim()) {
      const cleaned = focus.trim().replace(/\s*\([^)]*\)\s*$/, "").trim();
      setSearchQuery(cleaned);
      runSearch(cleaned, false);
      // Remove the param so refreshes don't re-trigger
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Lightbulb size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("suggestions.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("suggestions.subtitle")}</p>
        </div>
      </div>

      {/* Empty state */}
      {meals.length === 0 && (
        <div className="card-surface text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Lightbulb size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-foreground">{t("suggestions.empty")}</p>
          <button
            onClick={() => navigate("/log")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
          >
            {t("dashboard.logMeal")}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-fade-in">
          <div className="card-surface h-20 animate-pulse bg-secondary/40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-surface h-40 animate-pulse bg-secondary/40" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && meals.length > 0 && (
        <div className="card-surface card-tint-warning flex gap-3 items-start animate-fade-in">
          <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm text-foreground">{error}</p>
            <button
              onClick={() => fetchSuggestions(true)}
              className="text-xs font-semibold text-warning hover:underline"
            >
              {t("suggestions.tryAgain")}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && data && meals.length > 0 && (
        <div className="space-y-4">
          <GapSummary text={data.gapSummary} />

          <button
            onClick={() => fetchSuggestions(true)}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw size={14} />
            {t("suggestions.refresh")}
          </button>

          <div className="space-y-3">
            {data.suggestions.map((s, i) => (
              <SuggestionCard key={`${s.name}-${i}`} suggestion={s} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Suggestions;
