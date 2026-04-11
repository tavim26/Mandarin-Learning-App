import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Trophy, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useUsers } from '@/hooks/useUsers';
import { useProgress } from '@/hooks/useProgress';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { users, fetchAllUsers, isLoading: isLoadingUsers } = useUsers();
  const {
    leaderboard,
    fetchLeaderboard,
    isLoading: isLoadingProgress,
  } = useProgress();

  useEffect(() => {
    fetchAllUsers();
    fetchLeaderboard();
  }, [fetchAllUsers, fetchLeaderboard]);

  const isLoading = isLoadingUsers || isLoadingProgress;

  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview and management."
        icon={LayoutDashboard}
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="card-base p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Users
              </p>
              <p className="font-display text-3xl font-bold text-foreground">
                {users.length}
              </p>
            </div>
            <div className="card-base p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Students
              </p>
              <p className="font-display text-3xl font-bold text-student">
                {studentCount}
              </p>
            </div>
            <div className="card-base p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Teachers
              </p>
              <p className="font-display text-3xl font-bold text-teacher">
                {teacherCount}
              </p>
            </div>
            <div className="card-base p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Admins
              </p>
              <p className="font-display text-3xl font-bold text-foreground">
                {adminCount}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Utilizatori recenti */}
            <div className="card-base p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground">
                  Users
                </h2>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Manage all
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {users.length === 0 ? (
                <EmptyState icon={Users} title="No users yet" />
              ) : (
                <div className="space-y-2">
                  {users.slice(0, 6).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground truncate">
                        {user.fullName}
                      </span>
                      <span
                        className={`
                          text-xs font-medium px-2 py-0.5 rounded-full
                          ${user.role === 'STUDENT'
                            ? 'bg-student/10 text-student'
                            : user.role === 'TEACHER'
                            ? 'bg-teacher/10 text-teacher'
                            : 'bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* XP Leaderboard */}
            <div className="card-base p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground">
                  XP Leaderboard
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
        </>
      )}
    </div>
  );
};

export default AdminDashboard;