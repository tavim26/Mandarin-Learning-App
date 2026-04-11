import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  BarChart2,
  MessageSquare,
  Users,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/common/AppLayout';
import type { NavItem } from '@/components/common/AppLayout';
import type { Role } from '@/types';

// --- Pagini publice ---
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// --- Redirecturi pe rol ---
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';

// --- Student ---
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentUnitsPage from '@/pages/student/StudentUnitsPage';
import StudentUnitLessonsPage from '@/pages/student/StudentUnitLessonsPage';
import StudentLessonPage from '@/pages/student/StudentLessonPage';
import FlashcardsPage from '@/pages/student/FlashcardsPage';
import ReviewSessionPage from '@/pages/student/ReviewSessionPage';
import AnalysisPage from '@/pages/student/AnalysisPage';

// --- Teacher ---
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TeacherUnitPage from '@/pages/teacher/TeacherUnitPage';
import TeacherLessonPage from '@/pages/teacher/TeacherLessonPage';

// --- Admin ---
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';

// --- Profil ---
import StudentProfile from '@/pages/profile/StudentProfile';
import TeacherProfile from '@/pages/profile/TeacherProfile';
import AdminProfile from '@/pages/profile/AdminProfile';

// --- Shared ---
import ChatPage from '@/pages/shared/ChatPage';

// ============================================================
// NAV ITEMS — filtrate pe rol in AppLayout
// ============================================================
const NAV_ITEMS: NavItem[] = [
  // Student
  {
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: LayoutDashboard,
    roles: ['STUDENT'],
  },
  {
    label: 'Lessons',
    path: '/lessons',
    icon: BookOpen,
    roles: ['STUDENT'],
  },
  {
    label: 'Flashcards',
    path: '/flashcards',
    icon: Brain,
    roles: ['STUDENT'],
  },
  {
    label: 'Analysis',
    path: '/analysis',
    icon: BarChart2,
    roles: ['STUDENT'],
  },
  {
    label: 'Chat',
    path: '/chat',
    icon: MessageSquare,
    roles: ['STUDENT'],
  },
  // Teacher
  {
    label: 'Dashboard',
    path: '/teacher/dashboard',
    icon: LayoutDashboard,
    roles: ['TEACHER'],
  },
  {
    label: 'My Content',
    path: '/teacher/dashboard',
    icon: BookOpen,
    roles: ['TEACHER'],
  },
  // Admin
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Chat',
    path: '/chat',
    icon: MessageSquare,
    roles: ['ADMIN'],
  },
  // Shared
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    roles: ['STUDENT', 'TEACHER', 'ADMIN'],
  },
];

// ============================================================
// PROTECTED ROUTE
// ============================================================
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

  return <AppLayout navItems={NAV_ITEMS}>{children}</AppLayout>;
};

// ============================================================
// ROUTER
// ============================================================
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute publice */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Redirect pe rol */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect profil pe rol */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* --- Student --- */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentUnitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons/units/:unitId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentUnitLessonsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLessonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <FlashcardsPage />
            </ProtectedRoute>
          }
        />
        {/* ReviewSession — full screen, fara AppLayout */}
        <Route
          path="/flashcards/review/:setId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ReviewSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AnalysisPage />
            </ProtectedRoute>
          }
        />

        {/* --- Teacher --- */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/units/:unitId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherUnitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/lessons/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherLessonPage />
            </ProtectedRoute>
          }
        />

        {/* --- Admin --- */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        {/* --- Profile --- */}
        <Route
          path="/profile/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* --- Shared --- */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Wildcard — intotdeauna ultimul */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;