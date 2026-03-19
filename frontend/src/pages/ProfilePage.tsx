import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Redirectioneaza catre pagina de profil corespunzatoare rolului
const ProfilePage = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'STUDENT') return <Navigate to="/profile/student" replace />;
  if (role === 'TEACHER') return <Navigate to="/profile/teacher" replace />;
  if (role === 'ADMIN') return <Navigate to="/profile/admin" replace />;

  return <Navigate to="/login" replace />;
};

export default ProfilePage;