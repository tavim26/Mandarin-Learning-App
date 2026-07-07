import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Trophy,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useAuth } from '@/hooks/useAuth';

const StudentDashboard = () => {
  const { fullName } = useAuth();
  const navigate = useNavigate();
  const {
    summary,
    inProgressLessons,
    leaderboard,
    totalDue,
    isLoading,
  } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const xpToNextLevel = summary ? 100 - (summary.xpTotal % 100) : 100;
  const xpProgress = summary ? (summary.xpTotal % 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${fullName?.split(' ')[0] ?? 'Student'}`}
        subtitle="Here's your learning progress at a glance."
        icon={LayoutDashboard}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card-base p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Total XP
          </div>
          <p className="font-display text-3xl font-bold text-foreground">
            {summary?.xpTotal ?? 0}
          </p>
        </div>

        <div className="card-base p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <TrendingUp className="h-3.5 w-3.5 text-student" />
            Level
          </div>
          <p className="font-display text-3xl font-bold text-foreground">
            {summary?.level ?? 1}
          </p>
        </div>

        <div className="card-base p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <BookOpen className="h-3.5 w-3.5 text-teacher" />
            Completed
          </div>
          <p className="font-display text-3xl font-bold text-foreground">
            {summary?.completedLessonsCount ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">lessons</p>
        </div>

        <div
          onClick={() => navigate('/flashcards')}
          className="card-interactive p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Brain className="h-3.5 w-3.5 text-sm2-due" />
            Due Today
          </div>
          <p className="font-display text-3xl font-bold text-foreground">
            {totalDue?.totalDue ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">flashcards</p>
        </div>
      </div>

      {/* XP Progress bar */}
      {summary && (
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Level {summary.level} → Level {summary.level + 1}
            </span>
            <span className="text-muted-foreground">
              {xpProgress} / 100 XP
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {xpToNextLevel} XP needed to reach the next level
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lectii in progres */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">
              Continue Learning
            </h2>
            <button
              onClick={() => navigate('/lessons')}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              All lessons
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {inProgressLessons.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No lessons in progress"
              description="Start a lesson to see it here."
              actionLabel="Browse lessons"
              onAction={() => navigate('/lessons')}
            />
          ) : (
            <div className="space-y-2">
              {inProgressLessons.slice(0, 4).map((progress) => (
                <button
                  key={progress.lessonId}
                  onClick={() => navigate(`/lessons/${progress.lessonId}`)}
                  className="
                    w-full flex items-center gap-3 rounded-lg
                    border border-border bg-background px-3 py-2.5
                    hover:border-primary/30 hover:bg-accent
                    transition-colors duration-150 text-left
                  "
                >
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Lesson #{progress.lessonId}
                    </p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress.completionPct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {progress.completionPct.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">
              Leaderboard
            </h2>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </div>

          {leaderboard.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No data yet"
              description="Complete lessons to appear on the leaderboard."
            />
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                >
                  <span
                    className={`
                      flex h-6 w-6 shrink-0 items-center justify-center
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
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Zap className="h-3 w-3" />
                    {student.xpTotal}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flashcards due breakdown */}
      {totalDue && totalDue.totalDue > 0 && (
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">
              Flashcards Due Today
            </h2>
            <button
              onClick={() => navigate('/flashcards')}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Study now
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {totalDue.bySet.map((item) => (
              <div
                key={item.setId}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span className="text-sm text-foreground truncate max-w-[140px]">
                  {item.setTitle}
                </span>
                <span className="ml-2 shrink-0 flex h-6 min-w-6 items-center justify-center rounded-full bg-sm2-due px-1.5 text-xs font-bold text-white">
                  {item.dueCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


import { LayoutDashboard } from 'lucide-react';

export default StudentDashboard;