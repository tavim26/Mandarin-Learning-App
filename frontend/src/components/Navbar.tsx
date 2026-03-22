import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getStudentReplica } from '@/api/progressApi';

interface NavLink {
  label: string;
  path: string;
}

interface StudentStats {
  xpTotal: number;
  level: number;
}

const NAV_LINKS: Record<string, NavLink[]> = {
  STUDENT: [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Lessons', path: '/lessons' },
    { label: 'Flashcards', path: '/flashcards' },
    { label: 'Chatbot', path: '/chatbot' },
    { label: 'Analysis', path: '/analysis' },
  ],
  TEACHER: [
    { label: 'Dashboard', path: '/teacher/dashboard' },
    { label: 'Lessons', path: '/lessons' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Users', path: '/admin/users' },
  ],
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName, role, userId, clearAuth } = useAuthStore();

  // Statistici XP/level — doar pentru STUDENT
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    if (role !== 'STUDENT' || !userId) return;

    const fetchStats = async () => {
      try {
        const data = await getStudentReplica(userId);
        setStudentStats({ xpTotal: data.xpTotal, level: data.level });
      } catch {
  // La 404 (student fara activitate) — afiseaza valorile initiale
  setStudentStats({ xpTotal: 0, level: 1 });
}
    };

    fetchStats();
  }, [role, userId]);

  const links = role ? NAV_LINKS[role] ?? [] : [];

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav
      className="w-full h-16 flex items-center justify-between px-8 sticky top-0 z-50"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo */}
      <Link
        to="/dashboard"
        className="text-lg font-bold tracking-widest uppercase flex-shrink-0"
        style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.2em' }}
      >
        MandarinApp
      </Link>

      {/* Linkuri navigare */}
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color: isActive ? '#e85d04' : '#6b7280',
                background: isActive ? '#fff7f0' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Dreapta — XP badge (doar student), profil si logout */}
      <div className="flex items-center gap-4 flex-shrink-0">

        {/* Badge XP/Level — vizibil doar daca studentul are activitate */}
        {role === 'STUDENT' && studentStats !== null && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: '#fff7f0', border: '1px solid #fde8d4' }}
          >
            <div className="flex flex-col items-end">
              <span
                className="text-xs font-bold leading-none"
                style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
              >
                Level {studentStats.level}
              </span>
              <span className="text-xs text-gray-400 leading-none mt-0.5">
                {studentStats.xpTotal} XP
              </span>
            </div>
            {/* Indicator circular nivel */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
            >
              {studentStats.level}
            </div>
          </div>
        )}

        {/* Click pe nume/avatar duce la pagina de profil */}
        <Link
          to="/profile"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{fullName}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{role}</p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: '#e85d04' }}
          >
            {fullName?.charAt(0).toUpperCase()}
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-gray-100"
          style={{ color: '#6b7280' }}
        >
          Sign out
        </button>

      </div>
    </nav>
  );
};

export default Navbar;