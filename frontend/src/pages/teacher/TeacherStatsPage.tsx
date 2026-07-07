import { useEffect, useState, useMemo } from 'react';
import { BarChart2, BookOpen, Zap, Layers, Trophy } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { contentApi } from '@/api/contentApi';
import { colors, hskColors } from '@/styles/tokens';
import type { CourseUnitDto, LessonExerciseTypesDto, LessonDto } from '@/hooks/useContent';


// Tooltip personalizat
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card shadow-card px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}:{' '}
          <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// Tipuri date agregate
interface UnitStats {
  unit: CourseUnitDto;
  xp: number;
  lessonCount: number;
  lessons: LessonDto[];
}

interface ExerciseTypeAggregate {
  type: string;
  count: number;
}

const EXERCISE_TYPE_COLORS: Record<string, string> = {
  MULTIPLE_CHOICE: colors.primary,
  TRANSLATION: colors.teacherAccent,
  FILL_BLANK: colors.studentAccent,
  MATCHING: '#7c3aed',
  ORDERING: '#b45309',
};

const TeacherStatsPage = () => {
  const { userId } = useAuth();
  const { leaderboard, fetchLeaderboard } = useProgress();

  const [unitStats, setUnitStats] = useState<UnitStats[]>([]);
  const [exerciseTypeAgg, setExerciseTypeAgg] = useState<ExerciseTypeAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchLeaderboard();
    loadAllStats();
  }, [userId, fetchLeaderboard]);

  const loadAllStats = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Unitatile profesorului
      const units = await contentApi.getUnitsByTeacher(userId);
      if (units.length === 0) {
        setUnitStats([]);
        setIsLoading(false);
        return;
      }

      // 2. Stats per unitate 
      const [xpResults, lessonCountResults, lessonsResults] = await Promise.all([
        Promise.all(units.map((u) => contentApi.getUnitXpStats(u.id))),
        Promise.all(units.map((u) => contentApi.getUnitLessonCount(u.id))),
        Promise.all(units.map((u) => contentApi.getLessonsByUnit(u.id))),
      ]);

      const stats: UnitStats[] = units.map((unit, i) => ({
        unit,
        xp: xpResults[i].totalXp,
        lessonCount: lessonCountResults[i].totalLessons,
        lessons: lessonsResults[i],
      }));
      setUnitStats(stats);

      // 3. Distributie tipuri exercitii
      const allLessons = lessonsResults.flat();
      if (allLessons.length > 0) {
        const exerciseTypeResults: LessonExerciseTypesDto[] =
          await Promise.all(
            allLessons.map((l) =>
              contentApi.getLessonExerciseTypes(l.id).catch(() => ({
                lessonId: l.id,
                exerciseTypes: {},
              }))
            )
          );

        // Agrega per tip
        const aggregated: Record<string, number> = {};
        exerciseTypeResults.forEach((result) => {
          Object.entries(result.exerciseTypes).forEach(([type, count]) => {
            aggregated[type] = (aggregated[type] ?? 0) + (count as number);
          });
        });

        setExerciseTypeAgg(
          Object.entries(aggregated)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
        );
      }
    } catch {
      setError('Failed to load statistics.');
    } finally {
      setIsLoading(false);
    }
  };




  // Date pentru grafice
  const xpChartData = useMemo(
    () =>
      unitStats.map((s) => ({
        name:
          s.unit.title.length > 16
            ? s.unit.title.slice(0, 16) + '…'
            : s.unit.title,
        xp: s.xp,
        hskLevel: s.unit.hskLevel,
      })),
    [unitStats]
  );

  const lessonCountChartData = useMemo(
    () =>
      unitStats.map((s) => ({
        name:
          s.unit.title.length > 16
            ? s.unit.title.slice(0, 16) + '…'
            : s.unit.title,
        lessons: s.lessonCount,
      })),
    [unitStats]
  );

  const totalUnits = unitStats.length;
  const totalLessons = useMemo(
    () => unitStats.reduce((sum, s) => sum + s.lessonCount, 0),
    [unitStats]
  );
  const totalXp = useMemo(
    () => unitStats.reduce((sum, s) => sum + s.xp, 0),
    [unitStats]
  );
  const totalExercises = useMemo(
    () => exerciseTypeAgg.reduce((sum, e) => sum + e.count, 0),
    [exerciseTypeAgg]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Statistics"
        subtitle="Overview of your content and student engagement."
        icon={BarChart2}
      />

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : unitStats.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          description="Create course units and lessons to see statistics here."
        />
      ) : (
        <>
          {/* Sumar  */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Units
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {totalUnits}
              </p>
            </div>

            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-teacher" />
                Lessons
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {totalLessons}
              </p>
            </div>

            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Total XP Available
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {totalXp}
              </p>
            </div>

            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-student" />
                Exercises
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {totalExercises}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/*  XP per unitate*/}
            <div className="card-base p-5 space-y-4">
              <h2 className="font-display font-semibold text-foreground">
                XP Available per Unit
              </h2>
              {xpChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={xpChartData} barSize={28}>
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="xp" name="XP" radius={[4, 4, 0, 0]}>
                      {xpChartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.hskLevel
                              ? hskColors[entry.hskLevel] ?? colors.primary
                              : colors.primary
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Lectii per unitate */}
            <div className="card-base p-5 space-y-4">
              <h2 className="font-display font-semibold text-foreground">
                Lessons per Unit
              </h2>
              {lessonCountChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={lessonCountChartData} barSize={28}>
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="lessons"
                      name="Lessons"
                      fill={colors.teacherAccent}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Distributie tipuri exercitii */}
            <div className="card-base p-5 space-y-4">
              <h2 className="font-display font-semibold text-foreground">
                Exercise Types Distribution
              </h2>
              {exerciseTypeAgg.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No exercises yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={exerciseTypeAgg}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ percent }) =>
  percent !== undefined
    ? `${(percent * 100).toFixed(0)}%`
    : ''
}
                      labelLine={false}
                    >
                      {exerciseTypeAgg.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            EXERCISE_TYPE_COLORS[entry.type] ?? colors.primary
                          }
                        />
                      ))}
                    </Pie>
                    <Legend
                      iconSize={10}
                      formatter={(value) =>
                        value.replace(/_/g, ' ')
                      }
                      wrapperStyle={{
                        fontSize: '11px',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        String(name).replace(/_/g, ' '),
                      ]}
                      content={<CustomTooltip />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Student leaderboard */}
            <div className="card-base p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground">
                  Student Leaderboard
                </h2>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>

              {leaderboard.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No data yet"
                  description="Students will appear here after completing lessons."
                />
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((student, index) => (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <span
                        className={`
                          flex h-7 w-7 shrink-0 items-center justify-center
                          rounded-full text-xs font-bold
                          ${index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-600'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">
                        Student #{student.studentId}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Lv. {student.level}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-primary">
                        <Zap className="h-3.5 w-3.5" />
                        {student.xpTotal}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detaliu per unitate */}
          <div className="card-base p-5 space-y-4">
            <h2 className="font-display font-semibold text-foreground">
              Unit Breakdown
            </h2>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                      HSK
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Lessons
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      XP Available
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                      XP Distribution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unitStats.map((s) => (
                    <tr
                      key={s.unit.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {s.unit.title}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {s.unit.hskLevel ? (
                          <span
                            className={`hsk-badge bg-hsk-${s.unit.hskLevel} text-white`}
                          >
                            HSK {s.unit.hskLevel}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {s.lessonCount}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-primary">
                        {s.xp}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {totalXp > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-700"
                                style={{
                                  width: `${(s.xp / totalXp) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {((s.xp / totalXp) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherStatsPage;