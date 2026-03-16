import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Redirectioneaza utilizatorul catre dashboard-ul corespunzator rolului sau
const DashboardPage = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  if (role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;

  // Daca rolul lipseste, trimite utilizatorul la login
  return <Navigate to="/login" replace />;
};

export default DashboardPage;