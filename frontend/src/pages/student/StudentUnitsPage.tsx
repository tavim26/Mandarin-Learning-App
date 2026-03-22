import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getAllUnits, type CourseUnitDto } from '@/api/contentApi';
import { getUnitProgress, type StudentUnitProgressDto } from '@/api/progressApi';

const StudentUnitsPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuthStore();

  const [units, setUnits] = useState<CourseUnitDto[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, StudentUnitProgressDto>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const unitsData = await getAllUnits();
      setUnits(unitsData);

      // Fetch progresul per unitate in paralel — ignora erorile individuale
      const progressResults = await Promise.allSettled(
        unitsData.map((u) => getUnitProgress(u.id, userId!))
      );

      const map: Record<number, StudentUnitProgressDto> = {};
      progressResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          map[unitsData[index].id] = result.value;
        }
      });
      setProgressMap(map);
    } catch {
      setError('Failed to load course units.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1
          className="text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Lessons
        </h1>
        <p className="text-gray-400 text-sm">
          {units.length} course units available
        </p>
      </div>

      {/* Lista unitati */}
      {units.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-400 text-sm">No course units available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => {
            const progress = progressMap[unit.id];
            const pct = progress?.unitCompletionPct ?? 0;
            const completed = progress?.completedLessons ?? 0;
            const total = progress?.totalLessons ?? 0;

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md group"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                onClick={() => navigate(`/lessons/units/${unit.id}`)}
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Info unitate */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                      style={{ background: '#e85d04' }}
                    >
                      {unit.orderIndex}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p
                          className="text-lg font-bold text-gray-900"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          {unit.title}
                        </p>
                        {unit.hskLevel && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
                            style={{ background: '#fff7f0', color: '#e85d04' }}
                          >
                            HSK {unit.hskLevel}
                          </span>
                        )}
                      </div>
                      {unit.description && (
                        <p className="text-sm text-gray-400 mb-3">{unit.description}</p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {total > 0 ? `${completed} / ${total} lessons` : 'No lessons yet'}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: pct === 100 ? '#15803d' : '#e85d04' }}
                          >
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? '#15803d' : '#e85d04',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge status + arrow */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {pct === 100 && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-md"
                        style={{ background: '#f0fdf4', color: '#15803d' }}
                      >
                        Completed
                      </span>
                    )}
                    {pct > 0 && pct < 100 && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-md"
                        style={{ background: '#fff7f0', color: '#e85d04' }}
                      >
                        In Progress
                      </span>
                    )}
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

export default StudentUnitsPage;