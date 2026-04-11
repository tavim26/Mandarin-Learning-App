import { useEffect, useMemo } from 'react';
import { BarChart2, Zap, Users, TrendingUp } from 'lucide-react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { useProgress } from '@/hooks/useProgress';
import { colors } from '@/styles/tokens';

// Tooltip personalizat consistent cu design system-ul
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

const AdminStatsPage = () => {
  const {
    leaderboard,
    isLoading,
    fetchLeaderboard,
  } = useProgress();

  // Folosim getAllStudentsAdmin pentru datele complete
  const [allStudents, setAllStudents] = useState <
    { studentId: number; xpTotal: number; level: number }[]
>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    loadAllStudents();
  }, [fetchLeaderboard]);

  const loadAllStudents = async () => {
    setIsLoadingAll(true);
    try {
      const { progressApi } = await import('@/api/progressApi');
      const data = await progressApi.getAllStudentsAdmin();
      setAllStudents(data);
    } catch {
      // Ignoram silentios
    } finally {
      setIsLoadingAll(false);
    }
  };

  const isLoading_ = isLoading || isLoadingAll;

  // Distributie studenti pe nivel
  const levelDistribution = useMemo(() => {
    const map = new Map<number, number>();
    allStudents.forEach((s) => {
      map.set(s.level, (map.get(s.level) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({ name: `Level ${level}`, count }));
  }, [allStudents]);

  // Distributie studenti pe range XP
  const xpRanges = useMemo(() => {
    const ranges = [
      { label: '0–99', min: 0, max: 99 },
      { label: '100–299', min: 100, max: 299 },
      { label: '300–599', min: 300, max: 599 },
      { label: '600–999', min: 600, max: 999 },
      { label: '1000+', min: 1000, max: Infinity },
    ];
    return ranges.map((r) => ({
      name: r.label,
      count: allStudents.filter(
        (s) => s.xpTotal >= r.min && s.xpTotal <= r.max
      ).length,
    }));
  }, [allStudents]);

  // Statistici sumare
  const totalXp = useMemo(
    () => allStudents.reduce((sum, s) => sum + s.xpTotal, 0),
    [allStudents]
  );
  const avgXp = useMemo(
    () =>
      allStudents.length > 0
        ? Math.round(totalXp / allStudents.length)
        : 0,
    [allStudents, totalXp]
  );
  const maxLevel = useMemo(
    () =>
      allStudents.length > 0
        ? Math.max(...allStudents.map((s) => s.level))
        : 0,
    [allStudents]
  );

  const PIE_COLORS = [
    colors.primary,
    colors.teacherAccent,
    colors.studentAccent,
    '#7c3aed',
    '#b45309',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Platform Statistics"
        subtitle="Overview of student activity and progress."
        icon={BarChart2}
      />

      {isLoading_ ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : allStudents.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          description="Statistics will appear once students start completing lessons."
        />
      ) : (
        <>
          {/* Sumar */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Active Students
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {allStudents.length}
              </p>
            </div>

            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Total XP Earned
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {totalXp.toLocaleString()}
              </p>
            </div>

            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-student" />
                Average XP
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {avgXp}
              </p>
            </div>

            <div className="card-base p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-teacher" />
                Highest Level
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {maxLevel}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Bar chart — distributie pe nivel */}
            <div className="card-base p-5 space-y-4">
              <h2 className="font-display font-semibold text-foreground">
                Students by Level
              </h2>
              {levelDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={levelDistribution} barSize={32}>
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="count"
                      name="Students"
                      radius={[4, 4, 0, 0]}
                      fill={colors.primary}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart — distributie pe range XP */}
            <div className="card-base p-5 space-y-4">
              <h2 className="font-display font-semibold text-foreground">
                XP Distribution
              </h2>
              {xpRanges.every((r) => r.count === 0) ? (
                <p className="text-sm text-muted-foreground">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={xpRanges.filter((r) => r.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
  percent !== undefined
    ? `${name} (${(percent * 100).toFixed(0)}%)`
    : name
}
                      labelLine={false}
                    >
                      {xpRanges
                        .filter((r) => r.count > 0)
                        .map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                    </Pie>
                    <Legend
                      iconSize={10}
                      wrapperStyle={{
                        fontSize: '11px',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leaderboard top 10 */}
          <div className="card-base p-5 space-y-4">
            <h2 className="font-display font-semibold text-foreground">
              Top 10 Students by XP
            </h2>
            {leaderboard.length === 0 ? (
              <EmptyState icon={Zap} title="No leaderboard data yet." />
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
                      Level {student.level}
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
        </>
      )}
    </div>
  );
};

// Import useState — adaugat dupa scriere
import { useState } from 'react';

export default AdminStatsPage;