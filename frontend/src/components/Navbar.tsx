import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Definitia unui link de navigare
interface NavLink {
  label: string;
  path: string;
}

// Linkurile afisate per rol
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
    { label: 'Content', path: '/admin/content' },
  ],
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName, role, clearAuth } = useAuthStore();

  // Preia linkurile corespunzatoare rolului curent
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

      {/* Linkuri de navigare — centru */}
      <div className="flex items-center gap-1">
        {links.map((link) => {
          // Verifica daca link-ul curent este activ
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

      {/* Dreapta — nume utilizator si logout */}
      <div className="flex items-center gap-4 flex-shrink-0">

        {/* Numele si rolul utilizatorului */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">{fullName}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{role}</p>
        </div>

        {/* Avatar — initiala numelui */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: '#e85d04' }}
        >
          {fullName?.charAt(0).toUpperCase()}
        </div>

        {/* Buton logout */}
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