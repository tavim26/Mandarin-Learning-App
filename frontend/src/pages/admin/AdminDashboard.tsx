import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, type UserDto } from '@/api/usersApi';
import { getAllStudentsProgress, type StudentReplicaDto } from '@/api/progressApi';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Starea pentru utilizatori si progres
  const [users, setUsers] = useState<UserDto[]>([]);
  const [progress, setProgress] = useState<StudentReplicaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Incarca datele la montarea componentei
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, progressData] = await Promise.all([
          getAllUsers(),
          getAllStudentsProgress(),
        ]);
        setUsers(usersData);
        setProgress(progressData);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculeaza statisticile din lista de utilizatori
  const totalStudents = users.filter((u) => u.role === 'STUDENT').length;
  const totalTeachers = users.filter((u) => u.role === 'TEACHER').length;
  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;

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
          Admin Dashboard
        </h1>
        <p className="text-gray-400 text-sm">
          Platform overview and user management
        </p>
      </div>

      {/* Carduri statistici */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total utilizatori */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Users
          </p>
          <p
            className="text-4xl font-bold"
            style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
          >
            {users.length}
          </p>
        </div>

        {/* Total studenti */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Students
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {totalStudents}
          </p>
        </div>

        {/* Total profesori */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Teachers
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {totalTeachers}
          </p>
        </div>

        {/* Total admini */}
        <div
          className="bg-white rounded-2xl p-6 space-y-1"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Admins
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {totalAdmins}
          </p>
        </div>

      </div>

      {/* Sectiunea principala — doua coloane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Leaderboard studenti dupa XP */}
        <div
          className="bg-white rounded-2xl p-6 space-y-4"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              XP Leaderboard
            </h2>
            <span className="text-xs text-gray-400">Top students</span>
          </div>

          {progress.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No student activity yet.
            </p>
          ) : (
            <div className="space-y-3">
              {progress.map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-center gap-3">
                    {/* Pozitia in clasament */}
                    <span
                      className="text-sm font-bold w-6 text-center"
                      style={{ color: index === 0 ? '#e85d04' : '#9ca3af' }}
                    >
                      {index + 1}
                    </span>
                    {/* Avatar cu initiala ID-ului */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: index === 0 ? '#e85d04' : '#d1d5db' }}
                    >
                      S
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Student #{student.studentId}
                      </p>
                      <p className="text-xs text-gray-400">
                        Level {student.level}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: '#e85d04' }}
                  >
                    {student.xpTotal} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acces rapid + lista utilizatori recenti */}
        <div className="space-y-4">

          {/* Buton acces rapid Users */}
          <button
            onClick={() => navigate('/admin/users')}
            className="w-full bg-white rounded-2xl p-6 flex items-center justify-between transition-all hover:shadow-md group"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <div className="text-left">
              <p
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Manage Users
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                View, create and delete users
              </p>
            </div>
            <span
              className="text-2xl font-thin transition-transform group-hover:translate-x-1"
              style={{ color: '#e85d04' }}
            >
              →
            </span>
          </button>

          {/* Lista utilizatori recenti */}
          <div
            className="bg-white rounded-2xl p-6 space-y-4"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Recent Users
            </h2>

            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: '#e85d04' }}
                    >
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {user.fullName}
                    </p>
                  </div>
                  {/* Badge rol */}
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-md"
                    style={{
                      background: user.role === 'ADMIN'
                        ? '#fff7f0'
                        : user.role === 'TEACHER'
                        ? '#f0f9ff'
                        : '#f0fdf4',
                      color: user.role === 'ADMIN'
                        ? '#e85d04'
                        : user.role === 'TEACHER'
                        ? '#0369a1'
                        : '#15803d',
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;