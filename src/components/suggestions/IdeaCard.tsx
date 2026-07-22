import { Play, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { handleExternalClick } from "@/lib/external-link";

export interface IdeaSuggestion {
  name: string;
  benefitLine: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  tags: string[];
  searchQuery: string;
  // YouTube enrichment
  youtubeId?: string;
  youtubeTitle?: string;
  channelTitle?: string;
  youtubeThumbnailUrl?: string;
  youtubeWatchUrl?: string;
  youtubeSearchUrl?: string;
  // Article enrichment (optional)
  articleUrl?: string;
  articleTitle?: string;
  articleImage?: string;
  articleDescription?: string;
}

interface IdeaCardProps {
  idea: IdeaSuggestion;
  index?: number;
}

const IdeaCard = ({ idea, index = 0 }: IdeaCardProps) => {
  const { t } = useTranslation();
  const hasVideo = Boolean(idea.youtubeId);
  const watchUrl = hasVideo
    ? (idea.youtubeWatchUrl ?? `https://www.youtube.com/watch?v=${idea.youtubeId}`)
    : null;
  const thumb = hasVideo ? idea.youtubeThumbnailUrl : idea.articleImage;
  const heroUrl = watchUrl ?? idea.articleUrl ?? null;

  return (
    <div
      className="card-surface space-y-3 animate-fade-in overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Hero media — only when we have a real video or article to open */}
      {thumb && heroUrl ? (
        <a
          href={heroUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick(heroUrl)}
          className="block relative -mx-4 -mt-4 mb-1 aspect-video bg-secondary/60 group"
        >
          <img
            src={thumb}
            alt={idea.youtubeTitle || idea.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {hasVideo && (
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-lg">
                <Play size={20} className="text-primary fill-primary translate-x-0.5" />
              </div>
            </div>
          )}
          <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded">
            {idea.calories} {t("dashboard.kcal")}
          </span>
        </a>
      ) : (
        <div className="-mx-4 -mt-4 mb-1 px-4 py-3 bg-secondary/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{idea.name}</span>
          <span className="text-[11px] font-bold text-foreground bg-background/80 px-2 py-0.5 rounded">
            {idea.calories} {t("dashboard.kcal")}
          </span>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold text-foreground leading-tight">{idea.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{idea.benefitLine}</p>
      </div>

      <div className="flex gap-3 text-[11px] font-medium">
        <span className="text-nutrient-protein">P {idea.protein}g</span>
        <span className="text-nutrient-carbs">C {idea.carbs}g</span>
        <span className="text-nutrient-fat">F {idea.fat}g</span>
        <span className="text-nutrient-fiber">Fib {idea.fiber}g</span>
      </div>

      {idea.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {hasVideo && watchUrl && (
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick(watchUrl)}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Play size={14} className="fill-current" />
            {t("suggestions.watchRecipe")}
          </a>
        )}
        {idea.articleUrl && (
          <a
            href={idea.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick(idea.articleUrl)}
            className={`${hasVideo ? "px-3" : "flex-1"} py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform`}
            aria-label={t("suggestions.readArticle")}
            title={idea.articleTitle || t("suggestions.readArticle")}
          >
            <BookOpen size={14} />
            {!hasVideo && <span>{t("suggestions.readArticle")}</span>}
          </a>
        )}
      </div>
    </div>
  );
};

export default IdeaCard;