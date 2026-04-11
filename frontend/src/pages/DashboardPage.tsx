import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Pagina de redirect — trimite userul catre dashboard-ul corespunzator rolului sau.
const DashboardPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'STUDENT') navigate('/student/dashboard', { replace: true });
    else if (role === 'TEACHER') navigate('/teacher/dashboard', { replace: true });
    else if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
  }, [role, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default DashboardPage;