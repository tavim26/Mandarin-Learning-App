import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Pagina de redirect
const ProfilePage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'STUDENT') navigate('/profile/student', { replace: true });
    else if (role === 'TEACHER') navigate('/profile/teacher', { replace: true });
    else if (role === 'ADMIN') navigate('/profile/admin', { replace: true });
  }, [role, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default ProfilePage;