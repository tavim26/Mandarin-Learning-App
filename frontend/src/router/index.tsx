import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/auth';

import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import StudentDashboard from '@/pages/student/StudentDashboard';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import ProfilePage from '@/pages/ProfilePage';
import StudentProfile from '@/pages/profile/StudentProfile';
import TeacherProfile from '@/pages/profile/TeacherProfile';
import AdminProfile from '@/pages/profile/AdminProfile';

import TeacherUnitPage from '@/pages/teacher/TeacherUnitPage';
import TeacherLessonPage from '@/pages/teacher/TeacherLessonPage';

import StudentUnitsPage from '@/pages/student/StudentUnitsPage';
import StudentUnitLessonsPage from '@/pages/student/StudentUnitLessonsPage';
import StudentLessonPage from '@/pages/student/StudentLessonPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Infasoara continutul in AppLayout — adauga Navbar automat
  return <AppLayout>{children}</AppLayout>;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rute publice — fara Navbar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Router intermediar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard student */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard teacher */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />


        {/* Pagina management utilizatori */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
          </ProtectedRoute>
          }
        />

        {/* Router intermediar profil */}
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>

{/* Profil student */}
<Route
  path="/profile/student"
  element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentProfile />
    </ProtectedRoute>
  }
/>

{/* Profil teacher */}
<Route
  path="/profile/teacher"
  element={
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <TeacherProfile />
    </ProtectedRoute>
  }
/>

{/* Profil admin */}
<Route
  path="/profile/admin"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminProfile />
    </ProtectedRoute>
  }
/>


{/* Pagina lectii dintr-o unitate */}
<Route
  path="/teacher/units/:unitId"
  element={
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <TeacherUnitPage />
    </ProtectedRoute>
  }
/>

{/* Pagina exercitii + materiale dintr-o lectie */}
<Route
  path="/teacher/lessons/:lessonId"
  element={
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <TeacherLessonPage />
    </ProtectedRoute>
  }

  
/>

{/* Pagina unitati de curs — student */}
<Route
  path="/lessons"
  element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentUnitsPage />
    </ProtectedRoute>
  }
/>

{/* Pagina lectii dintr-o unitate — student */}
<Route
  path="/lessons/units/:unitId"
  element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentUnitLessonsPage />
    </ProtectedRoute>
  }
/>

{/* Pagina detaliu lectie — student */}
<Route
  path="/lessons/:lessonId"
  element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLessonPage />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
};




export default AppRouter;