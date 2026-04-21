import { Play, Search, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface RecipeSwap {
  name: string;
  whyHealthier: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  proteinAddedG?: number;
  sugarReductionPct?: number;
  tags?: string[];
  youtubeId?: string;
  youtubeTitle?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  youtubeSearchUrl: string;
}

interface SwapCardProps {
  swap: RecipeSwap;
  index?: number;
}

const SwapCard = ({ swap, index = 0 }: SwapCardProps) => {
  const { t } = useTranslation();
  const hasVideo = Boolean(swap.youtubeId);
  const watchUrl = hasVideo
    ? `https://www.youtube.com/watch?v=${swap.youtubeId}`
    : swap.youtubeSearchUrl;

  return (
    <div
      className="card-surface space-y-3 animate-fade-in overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Thumbnail */}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative -mx-4 -mt-4 mb-1 aspect-video bg-secondary/60 group"
      >
        {swap.thumbnailUrl ? (
          <img
            src={swap.thumbnailUrl}
            alt={swap.youtubeTitle || swap.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Search size={28} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-lg">
            <Play size={20} className="text-primary fill-primary translate-x-0.5" />
          </div>
        </div>
      </a>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground leading-tight flex-1">{swap.name}</h3>
        <span className="text-xs font-bold text-warning whitespace-nowrap">
          {swap.calories} {t("dashboard.kcal")}
        </span>
      </div>

      {/* Healthier-by chip(s) */}
      <div className="flex flex-wrap gap-1.5">
        {swap.proteinAddedG !== undefined && swap.proteinAddedG > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/25">
            +{swap.proteinAddedG}g {t("dashboard.protein").toLowerCase()}
          </span>
        )}
        {swap.sugarReductionPct !== undefined && swap.sugarReductionPct > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/25">
            −{swap.sugarReductionPct}% {t("dashboard.sugar").toLowerCase()}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">{t("suggestions.healthierBy")}: </span>
        {swap.whyHealthier}
      </p>

      <div className="flex gap-3 text-[11px] font-medium">
        <span className="text-nutrient-protein">P {swap.protein}g</span>
        <span className="text-nutrient-carbs">C {swap.carbs}g</span>
        <span className="text-nutrient-fat">F {swap.fat}g</span>
        <span className="text-nutrient-fiber">Fib {swap.fiber}g</span>
      </div>

      {swap.tags && swap.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {swap.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        {hasVideo ? (
          <>
            <Play size={14} className="fill-current" />
            {t("suggestions.watchRecipe")}
          </>
        ) : (
          <>
            <ExternalLink size={14} />
            {t("suggestions.searchOnYoutube")}
          </>
        )}
      </a>
    </div>
  );
};

export default SwapCard;