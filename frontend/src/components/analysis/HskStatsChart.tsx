import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { hskColors, hskUnknownColor } from '@/styles/tokens';
import type { StudentStatsDto } from '@/hooks/useAnalysis';

interface Props {
  stats: StudentStatsDto;
}

interface ChartEntry {
  name: string;
  tokens: number;
  unique: number;
  percentage: number;
  color: string;
}

// Tooltip personalizat — stilizat cu design system-ul propriu
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

export const HskStatsChart = ({ stats }: Props) => {
  const chartData = useMemo((): ChartEntry[] => {
    const distributionMap = new Map(
      stats.token_distribution.map((d) => [d.hsk_level, d.token_count])
    );
    const uniqueMap = new Map(
      stats.unique_chars_per_hsk_level.map((u) => [
        u.hsk_level,
        { unique: u.unique_count, percentage: u.percentage },
      ])
    );

    const levels: (number | null)[] = [1, 2, 3, 4, 5, 6, null];

    return levels
      .filter((level) => distributionMap.has(level))
      .map((level) => ({
        name: level ? `HSK ${level}` : 'Unknown',
        tokens: distributionMap.get(level) ?? 0,
        unique: uniqueMap.get(level as number)?.unique ?? 0,
        percentage: uniqueMap.get(level as number)?.percentage ?? 0,
        color: level ? (hskColors[level] ?? hskUnknownColor) : hskUnknownColor,
      }));
  }, [stats]);

  // Statistici sumare
  const totalTokens = useMemo(
    () => stats.token_distribution.reduce((sum, d) => sum + d.token_count, 0),
    [stats]
  );

  const manualCount = stats.source_type_split['MANUAL'] ?? 0;
  const ocrCount = stats.source_type_split['OCR'] ?? 0;

  return (
    <div className="space-y-6">
      {/* Sumar analize */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-base p-4 text-center space-y-1">
          <p className="text-2xl font-display font-bold text-foreground">
            {totalTokens}
          </p>
          <p className="text-xs text-muted-foreground">Total tokens</p>
        </div>
        <div className="card-base p-4 text-center space-y-1">
          <p className="text-2xl font-display font-bold text-foreground">
            {manualCount}
          </p>
          <p className="text-xs text-muted-foreground">Manual analyses</p>
        </div>
        <div className="card-base p-4 text-center space-y-1">
          <p className="text-2xl font-display font-bold text-foreground">
            {ocrCount}
          </p>
          <p className="text-xs text-muted-foreground">OCR analyses</p>
        </div>
      </div>

      {/* Bar chart distributie HSK */}
      <div className="card-base p-4 space-y-3">
        <h3 className="font-display font-semibold text-sm text-foreground">
          Token distribution by HSK level
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={32}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tokens" name="Tokens" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress bars vocabular per nivel */}
      {stats.unique_chars_per_hsk_level.length > 0 && (
        <div className="card-base p-4 space-y-3">
          <h3 className="font-display font-semibold text-sm text-foreground">
            Vocabulary coverage per HSK level
          </h3>
          <div className="space-y-3">
            {stats.unique_chars_per_hsk_level.map((level) => (
              <div key={level.hsk_level} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    HSK {level.hsk_level}
                  </span>
                  <span className="text-muted-foreground">
                    {level.unique_count} / {level.total_in_level} words
                    <span className="ml-2 font-semibold text-foreground">
                      {level.percentage.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${level.percentage}%`,
                      backgroundColor: hskColors[level.hsk_level],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};