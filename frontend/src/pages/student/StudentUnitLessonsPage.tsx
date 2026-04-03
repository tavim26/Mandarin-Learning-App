import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUnitFull } from '@/hooks/useContent';
import { useAllLessonProgress } from '@/hooks/useProgress';

const STATUS_CONFIG = {
  COMPLETED:   { label: 'Completed',   bg: '#f0fdf4', color: '#15803d' },
  IN_PROGRESS: { label: 'In Progress', bg: '#fff7f0', color: '#e85d04' },
  NOT_STARTED: { label: 'Not Started', bg: '#f9fafb', color: '#9ca3af' },
};

const StudentUnitLessonsPage = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const parsedUnitId = parseInt(unitId ?? '0');

  // useUnitFull include lectiile in raspuns — nu mai avem nevoie de getLessonsByUnit separat
  const { unit, loading: unitLoading, error: unitError } = useUnitFull(parsedUnitId);
  const { lessons: allProgress, loading: progressLoading } = useAllLessonProgress(userId!);

  const loading = unitLoading || progressLoading;
  const error = unitError;

  // Construieste map lessonId → progress din lista plata
  const progressMap = allProgress.reduce<Record<number, typeof allProgress[0]>>(
    (acc, p) => { acc[p.lessonId] = p; return acc; },
    {}
  );

  const lessons = unit?.lessons ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error ?? 'Unit not found.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/lessons"
          className="font-medium transition-colors hover:opacity-70"
          style={{ color: '#e85d04' }}
        >
          Lessons
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500 truncate">{unit.title}</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {unit.title}
          </h1>
          {unit.hskLevel && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ background: '#fff7f0', color: '#e85d04' }}
            >
              HSK {unit.hskLevel}
            </span>
          )}
        </div>
        {unit.description && (
          <p className="text-gray-400 text-sm">{unit.description}</p>
        )}
      </div>

      {lessons.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-400 text-sm">No lessons in this unit yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const progress = progressMap[lesson.id];
            const status = progress?.status ?? 'NOT_STARTED';
            const pct = progress?.completionPct ?? 0;
            const statusConfig = STATUS_CONFIG[status];

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md group"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                onClick={() => navigate(`/lessons/${lesson.id}`)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        background:
                          status === 'COMPLETED' ? '#15803d' :
                          status === 'IN_PROGRESS' ? '#e85d04' : '#d1d5db',
                      }}
                    >
                      {status === 'COMPLETED' ? '✓' : lesson.orderIndex}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p
                          className="text-base font-bold text-gray-900"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          {lesson.title}
                        </p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: '#f0fdf4', color: '#15803d' }}
                        >
                          +{lesson.xpReward} XP
                        </span>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-gray-400 truncate mb-2">
                          {lesson.description}
                        </p>
                      )}
                      {status !== 'NOT_STARTED' && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: status === 'COMPLETED' ? '#15803d' : '#e85d04',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md hidden sm:block"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>
                    <span
                      className="text-xl font-thin transition-transform group-hover:translate-x-1"
                      style={{ color: '#e85d04' }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentUnitLessonsPage;