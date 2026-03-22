import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  getStudentSummary,
  getInProgressLessons,
  type StudentSummaryDto,
  type StudentLessonProgressDto,
} from '@/api/progressApi';
import { getDueAll, type TotalDueStatsDto } from '@/api/flashcardApi';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { userId } = useAuthStore();

  const [summary, setSummary] = useState<StudentSummaryDto | null>(null);
  const [inProgress, setInProgress] = useState<StudentLessonProgressDto[]>([]);
  const [dueStats, setDueStats] = useState<TotalDueStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, inProgressData, dueData] = await Promise.all([
        getStudentSummary(userId!).catch(() => null),
        getInProgressLessons(userId!).catch(() => []),
        getDueAll().catch(() => null),
      ]);
      setSummary(summaryData);
      setInProgress(inProgressData);
      setDueStats(dueData);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Calculeaza procentul de XP catre urmatorul nivel
  const xpForCurrentLevel = summary ? (summary.level - 1) * 100 : 0;
  const xpProgress = summary ? summary.xpTotal - xpForCurrentLevel : 0;
  const xpPct = Math.min((xpProgress / 100) * 100, 100);

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
          Dashboard
        </h1>
        <p className="text-gray-400 text-sm">
          Track your progress and continue learning
        </p>
      </div>

      {/* Carduri statistici principale */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* XP Total */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total XP
          </p>
          <p
            className="text-4xl font-bold"
            style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
          >
            {summary?.xpTotal ?? 0}
          </p>
        </div>

        {/* Level */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Level
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {summary?.level ?? 1}
          </p>
        </div>

        {/* Lectii completate */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Lessons Done
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {summary?.completedLessonsCount ?? 0}
          </p>
        </div>

        {/* Flashcards scadente */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Cards Due
          </p>
          <p
            className="text-4xl font-bold"
            style={{
              color: (dueStats?.totalDue ?? 0) > 0 ? '#c1121f' : '#111827',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {dueStats?.totalDue ?? 0}
          </p>
        </div>

      </div>

      {/* XP Progress bar catre urmatorul nivel */}
      {summary && (
        <div
          className="bg-white rounded-2xl p-6 space-y-3"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-sm font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Level {summary.level} → Level {summary.level + 1}
            </p>
            <p className="text-xs text-gray-400">
              {xpProgress} / 100 XP
            </p>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${xpPct}%`,
                background: '#e85d04',
              }}
            />
          </div>
        </div>
      )}

      {/* Sectiunea principala — doua coloane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lectii in curs */}
        <div
          className="bg-white rounded-2xl p-6 space-y-4"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Continue Learning
            </h2>
            <button
              onClick={() => navigate('/lessons')}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#e85d04' }}
            >
              All lessons →
            </button>
          </div>

          {inProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <p className="text-sm text-gray-400 text-center">
                No lessons in progress yet.
              </p>
              <button
                onClick={() => navigate('/lessons')}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: '#e85d04' }}
              >
                Browse Lessons
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgress.slice(0, 4).map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => navigate(`/lessons/${lesson.lessonId}`)}
                  className="w-full text-left p-3 rounded-xl transition-all hover:bg-gray-50 group"
                  style={{ border: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800">
                      Lesson #{lesson.lessonId}
                    </p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: '#fff7f0', color: '#e85d04' }}
                    >
                      {Math.round(lesson.completionPct)}%
                    </span>
                  </div>
                  {/* Progress bar per lectie */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${lesson.completionPct}%`,
                        background: '#e85d04',
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flashcards scadente per set */}
        <div
          className="bg-white rounded-2xl p-6 space-y-4"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Flashcards Due Today
            </h2>
            <button
              onClick={() => navigate('/flashcards')}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#e85d04' }}
            >
              All sets →
            </button>
          </div>

          {!dueStats || dueStats.totalDue === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-2">
              <p className="text-sm font-semibold text-gray-700">
                All caught up!
              </p>
              <p className="text-xs text-gray-400 text-center">
                No flashcards due today.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dueStats.bySet.slice(0, 5).map((set) => (
                <button
                  key={set.setId}
                  onClick={() => navigate('/flashcards')}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-gray-50"
                  style={{ border: '1px solid #f3f4f6' }}
                >
                  <p className="text-sm font-medium text-gray-800 text-left truncate pr-4">
                    {set.setTitle}
                  </p>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0"
                    style={{ background: '#fef2f2', color: '#c1121f' }}
                  >
                    {set.dueCount} due
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Shortcut-uri rapide */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lessons', description: 'Browse course content', path: '/lessons', color: '#e85d04' },
          { label: 'Flashcards', description: 'Review vocabulary', path: '/flashcards', color: '#0369a1' },
          { label: 'Chatbot', description: 'Practice with AI tutor', path: '/chatbot', color: '#15803d' },
          { label: 'Analysis', description: 'Analyze Chinese text', path: '/analysis', color: '#7c3aed' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-2xl p-5 text-left transition-all hover:shadow-md group"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <p
              className="text-base font-bold"
              style={{ color: item.color, fontFamily: 'Outfit, sans-serif' }}
            >
              {item.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
            <span
              className="text-lg font-thin mt-2 block transition-transform group-hover:translate-x-1"
              style={{ color: item.color }}
            >
              →
            </span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default StudentDashboard;