import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Lightbulb, RefreshCw, AlertCircle, Sparkles, Loader2, Database } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getMealsByDate,
  getProfile,
  getTodayString,
} from "@/lib/nutrition-store";
import { sumTotals } from "@/lib/insights";
import GapSummary from "@/components/suggestions/GapSummary";
import IdeaCard, { type IdeaSuggestion } from "@/components/suggestions/IdeaCard";
import IdeasFilters, {
  type MealTypeFilter,
  type MealWeightFilter,
} from "@/components/suggestions/IdeasFilters";
import RecipeSearchBar from "@/components/suggestions/RecipeSearchBar";
import SwapCard, { type RecipeSwap } from "@/components/suggestions/SwapCard";
import { toast } from "@/hooks/use-toast";

interface SuggestionsResponse {
  gapSummary: string;
  suggestions: IdeaSuggestion[];
}

const SEARCH_CACHE_KEY = "nutrilens-recipe-search-cache";
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state (no default — user must pick a meal type to load ideas)
  const [mealType, setMealType] = useState<MealTypeFilter | null>(null);
  const [mealWeight, setMealWeight] = useState<MealWeightFilter>("light");

  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

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

  const remaining = useMemo(
    () => ({
      calories: Math.max(profile.calorieTarget - totals.calories, 0),
      protein: Math.max(profile.proteinTarget - totals.protein, 0),
      carbs: Math.max(profile.carbsTarget - totals.carbs, 0),
      fat: Math.max(profile.fatTarget - totals.fat, 0),
      fiber: Math.max(profile.fiberTarget - totals.fiber, 0),
    }),
    [profile, totals],
  );

  const deficits = useMemo(
    () => ({
      protein: Math.max(profile.proteinTarget - totals.protein, 0),
      fiber: Math.max(profile.fiberTarget - totals.fiber, 0),
      calories: Math.max(profile.calorieTarget - totals.calories, 0),
    }),
    [profile, totals],
  );

  // Track in-flight requests so filter changes cancel stale ones.
  const requestIdRef = useRef(0);

  const fetchIdeas = useCallback(
    async (forceRefresh = false) => {
      if (!user || !mealType) return;
      const reqId = ++requestIdRef.current;
      setError(null);

      // 1. Try server cache first (cached_ideas).
      if (!forceRefresh) {
        try {
          const { data: cacheRow } = await supabase
            .from("cached_ideas")
            .select("suggestions, updated_at")
            .eq("user_id", user.id)
            .eq("diet_type", profile.dietType)
            .eq("meal_type", mealType)
            .eq("meal_weight", mealWeight)
            .maybeSingle();

          if (reqId !== requestIdRef.current) return; // stale
          if (cacheRow?.suggestions) {
            // Same-day cache hit
            const updated = new Date(cacheRow.updated_at);
            const isToday = updated.toISOString().split("T")[0] === today;
            if (isToday) {
              setData(cacheRow.suggestions as unknown as SuggestionsResponse);
              setFromCache(true);
              return;
            }
          }
        } catch (e) {
          // ignore cache read errors and fall through to live fetch
          console.warn("cached_ideas read failed", e);
        }
      }

      // 2. Live fetch from edge function
      setLoading(true);
      setFromCache(false);
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
            allergies: profile.allergies,
            allergiesOther: profile.allergiesOther,
            healthGoal: profile.goals[0],
            mealType,
            mealWeight,
            deficits,
          },
        });

        if (reqId !== requestIdRef.current) return; // stale
        if (fnError) throw fnError;
        if (!resp || (resp as { error?: string }).error) {
          throw new Error((resp as { error?: string })?.error || "Failed to load ideas");
        }

        const result = resp as SuggestionsResponse;
        setData(result);

        // 3. Persist to server cache (upsert)
        try {
          await supabase
            .from("cached_ideas")
            .upsert(
              {
                user_id: user.id,
                diet_type: profile.dietType,
                meal_type: mealType,
                meal_weight: mealWeight,
                suggestions: result as unknown as never,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,diet_type,meal_type,meal_weight" },
            );
        } catch (e) {
          console.warn("cached_ideas upsert failed", e);
        }
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setError(msg);
        toast({ title: t("suggestions.errorTitle"), description: msg, variant: "destructive" });
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, mealType, mealWeight, profile.dietType, today],
  );

  // Refetch whenever filter or user changes (only after a meal type is picked).
  useEffect(() => {
    if (mealType) fetchIdeas(false);
  }, [fetchIdeas]);

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
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterLabel = mealType ? t(`suggestions.filters.${mealType}`) : "";
  const weightLabel = t(`suggestions.filters.${mealWeight}`);

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

      {/* Search bar — always visible */}
      <RecipeSearchBar
        key={searchQuery}
        initialValue={searchQuery}
        loggedToday={loggedTodayChips}
        loading={searchLoading}
        onSearch={(q) => {
          setSearchQuery(q);
          runSearch(q, false);
        }}
      />

      {/* Search loading */}
      {searchLoading && (
        <div className="space-y-3 animate-fade-in">
          <div className="card-surface flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin text-primary" />
            {t("common.loading")}
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="card-surface h-72 animate-pulse bg-secondary/40" />
          ))}
        </div>
      )}

      {/* Search error */}
      {!searchLoading && searchError && (
        <div className="card-surface card-tint-warning flex gap-3 items-start animate-fade-in">
          <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm text-foreground">{searchError}</p>
            <button
              onClick={() => activeQuery && runSearch(activeQuery, true)}
              className="text-xs font-semibold text-warning hover:underline"
            >
              {t("suggestions.tryAgain")}
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {!searchLoading && searchResults && searchResults.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-end justify-between gap-2 px-1">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-info" />
                {t("suggestions.searchResultsTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("suggestions.searchResultsSub")} · "{activeQuery}"
              </p>
            </div>
            <button
              onClick={() => runSearch(activeQuery, true)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
              aria-label={t("suggestions.refresh")}
            >
              <RefreshCw size={12} />
              {t("suggestions.refresh")}
            </button>
          </div>
          <div className="space-y-3">
            {searchResults.map((s, i) => (
              <SwapCard key={`${s.name}-${i}`} swap={s} index={i} />
            ))}
          </div>
        </div>
      )}

      {!searchLoading && searchResults && searchResults.length === 0 && (
        <div className="card-surface text-center text-sm text-muted-foreground animate-fade-in">
          {t("suggestions.noResults")}
        </div>
      )}

      {/* ============ Ideas-for-you section ============ */}
      <div className="pt-2 px-1">
        <h2 className="text-lg font-bold text-foreground">{t("suggestions.ideasForTitle")}</h2>
        {mealType && (
          <p className="text-xs text-muted-foreground">
            {t("suggestions.ideasForSub", { type: filterLabel, weight: weightLabel })}
          </p>
        )}
      </div>

      <IdeasFilters
        mealType={mealType}
        mealWeight={mealWeight}
        onMealTypeChange={setMealType}
        onMealWeightChange={setMealWeight}
      />

      {/* Prompt state — before any meal-type pick */}
      {!mealType && !loading && (
        <div className="card-surface text-center text-sm text-muted-foreground animate-fade-in">
          {t("suggestions.pickMealPrompt")}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-fade-in">
          <div className="card-surface h-20 animate-pulse bg-secondary/40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-surface h-72 animate-pulse bg-secondary/40" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card-surface card-tint-warning flex gap-3 items-start animate-fade-in">
          <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm text-foreground">{error}</p>
            <button
              onClick={() => fetchIdeas(true)}
              className="text-xs font-semibold text-warning hover:underline"
            >
              {t("suggestions.tryAgain")}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <div className="space-y-4">
          {data.gapSummary && <GapSummary text={data.gapSummary} />}

          <div className="flex items-center justify-between gap-2">
            {fromCache ? (
              <span className="text-[11px] font-medium text-muted-foreground inline-flex items-center gap-1">
                <Database size={11} />
                {t("suggestions.cached")}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={() => fetchIdeas(true)}
              disabled={loading}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 active:scale-95 transition-transform"
            >
              <RefreshCw size={12} />
              {t("suggestions.refresh")}
            </button>
          </div>

          <div className="space-y-3">
            {data.suggestions.map((s, i) => (
              <IdeaCard key={`${s.name}-${i}`} idea={s} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no results AND not loading AND no error */}
      {!loading && !error && !data && meals.length === 0 && (
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
    </div>
  );
};

export default Suggestions;