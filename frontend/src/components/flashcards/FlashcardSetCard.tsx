import { useState, useCallback } from 'react';
import { BookOpen, Calendar, TrendingUp } from 'lucide-react';
import type { FlashcardSetDto, FlashcardSetStatsDto } from '@/hooks/useFlashcards';

interface Props {
  set: FlashcardSetDto;
  onClick: () => void;
  onStudy: () => void;
}

export const FlashcardSetCard = ({ set, onClick, onStudy }: Props) => {
  const [stats, setStats] = useState<FlashcardSetStatsDto | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleMouseEnter = useCallback(async () => {
    if (stats) return; 
    setIsLoadingStats(true);
    try {
     
      const { flashcardApi } = await import('@/api/flashcardApi');
      const result = await flashcardApi.getSetStats(set.id);
      setStats(result);
    } catch {
      // silent ignore
    } finally {
      setIsLoadingStats(false);
    }
  }, [set.id, stats]);

  const dueCount = stats?.dueToday ?? 0;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      className="card-interactive group p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate">
            {set.title}
          </h3>
          {set.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {set.description}
            </p>
          )}
        </div>
        {dueCount > 0 && (
          <span className="shrink-0 flex h-6 min-w-6 items-center justify-center rounded-full bg-sm2-due px-1.5 text-xs font-bold text-white">
            {dueCount}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {set.cardCount} cards
        </span>
        {stats && (
          <>
            <span className="flex items-center gap-1 text-sm2-mature">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.matureCards} mature
            </span>
            <span className="flex items-center gap-1 text-sm2-learning">
              <Calendar className="h-3.5 w-3.5" />
              {stats.learningCards} learning
            </span>
          </>
        )}
        {isLoadingStats && (
          <span className="text-muted-foreground/50 animate-pulse">
            Loading stats...
          </span>
        )}
      </div>

      {/* Progress bar SM-2*/}
      {stats && stats.totalCards > 0 && (
        <div className="space-y-1.5 animate-fade-in">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-sm2-new transition-all duration-500"
              style={{
                width: `${(stats.newCards / stats.totalCards) * 100}%`,
              }}
            />
            <div
              className="bg-sm2-learning transition-all duration-500"
              style={{
                width: `${(stats.learningCards / stats.totalCards) * 100}%`,
              }}
            />
            <div
              className="bg-sm2-mature transition-all duration-500"
              style={{
                width: `${(stats.matureCards / stats.totalCards) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{stats.newCards} new</span>
            <span>{stats.learningCards} learning</span>
            <span>{stats.matureCards} mature</span>
          </div>
        </div>
      )}

      {/* Study button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStudy();
        }}
        disabled={stats !== null && dueCount === 0}
        className={`
          w-full rounded-lg py-2 text-sm font-medium transition-all duration-150
          ${stats === null || dueCount > 0
            ? 'bg-primary text-white hover:bg-[hsl(var(--brand-hover))]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
          }
        `}
      >
        {stats === null
          ? `Study ${set.cardCount} cards`
          : dueCount > 0
          ? `Study ${dueCount} due cards`
          : 'All caught up'
        }
      </button>
    </div>
  );
};