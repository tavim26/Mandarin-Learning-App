import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { useContent } from '@/hooks/useContent';

const HSK_LEVELS = [1, 2, 3, 4, 5, 6];

const hskBadgeClass: Record<number, string> = {
  1: 'bg-hsk-1',
  2: 'bg-hsk-2',
  3: 'bg-hsk-3',
  4: 'bg-hsk-4',
  5: 'bg-hsk-5',
  6: 'bg-hsk-6',
};

const StudentUnitsPage = () => {
  const navigate = useNavigate();
  const { units, isLoading, error, fetchUnits } = useContent();
  const [activeFilter, setActiveFilter] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchUnits(activeFilter);
  }, [activeFilter, fetchUnits]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Course Units"
        subtitle="Choose a unit to start learning."
        icon={BookOpen}
        breadcrumbs={[{ label: 'Lessons' }]}
      />

      {/* Filtru HSK */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          size="sm"
          variant={activeFilter === undefined ? 'default' : 'outline'}
          onClick={() => setActiveFilter(undefined)}
          className={activeFilter === undefined ? 'btn-brand' : ''}
        >
          All
        </Button>
        {HSK_LEVELS.map((level) => (
          <Button
            key={level}
            size="sm"
            variant={activeFilter === level ? 'default' : 'outline'}
            onClick={() =>
              setActiveFilter(activeFilter === level ? undefined : level)
            }
            className={
              activeFilter === level
                ? `text-white ${hskBadgeClass[level]}`
                : ''
            }
          >
            HSK {level}
          </Button>
        ))}
      </div>

      {/* Content */}
      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : units.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No units found"
          description={
            activeFilter
              ? `No units available for HSK ${activeFilter}.`
              : 'No course units are available yet.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => navigate(`/lessons/units/${unit.id}`)}
              className="card-interactive p-5 text-left space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold text-foreground leading-snug">
                  {unit.title}
                </h3>
                {unit.hskLevel && (
                  <span
                    className={`hsk-badge shrink-0 ${hskBadgeClass[unit.hskLevel] ?? 'bg-muted'}`}
                  >
                    HSK {unit.hskLevel}
                  </span>
                )}
              </div>

              {/* Description */}
              {unit.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {unit.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                View lessons
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentUnitsPage;