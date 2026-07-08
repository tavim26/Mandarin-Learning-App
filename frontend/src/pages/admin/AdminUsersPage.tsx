import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Trash2, KeyRound, Pencil, Search, Ban, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { ResetPasswordModal } from '@/components/modals/ResetPasswordModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { EditStudentModal } from '@/components/modals/EditStudentModal';
import { EditTeacherModal } from '@/components/modals/EditTeacherModal';
import { BanConfirmModal } from '@/components/modals/BanConfirmModal';
import { useUsers } from '@/hooks/useUsers';

import type { Role } from '@/hooks/useAuth';

import type {
  StudentProfileDto,
  TeacherProfileDto,
} from '@/hooks/useUsers';

const AdminUsersPage = () => {
  const {
    students,
    teachers,
    isLoading,
    error,
    fetchStudents,
    fetchTeachers,
    deleteUser,
    banUser,
    unbanUser
  } = useUsers();

  const [searchStudents, setSearchStudents] = useState('');
  const [searchTeachers, setSearchTeachers] = useState('');

  const [createOpen, setCreateOpen] = useState(false);

  const [editStudentTarget, setEditStudentTarget] =
    useState<StudentProfileDto | null>(null);
  const [editTeacherTarget, setEditTeacherTarget] =
    useState<TeacherProfileDto | null>(null);

  const [resetTarget, setResetTarget] = useState<{
  id: number;
  fullName: string;
  role: Role;
  banned: boolean;
} | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const [banTarget, setBanTarget] = useState<{ id: number; name: string; banned: boolean } | null>(null);
  const [isBanning, setIsBanning] = useState(false);



  useEffect(() => {
    fetchStudents();
    fetchTeachers();
  }, [fetchStudents, fetchTeachers]);

  const refresh = useCallback(() => {
    fetchStudents();
    fetchTeachers();
  }, [fetchStudents, fetchTeachers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteUser(deleteTarget.id);
    setIsDeleting(false);
    if (success) {
      setDeleteTarget(null);
      refresh();
    }
  };


  const handleToggleBan = async () => {
    if (!banTarget) return;
    setIsBanning(true);
    
    const success = banTarget.banned 
      ? await unbanUser(banTarget.id) 
      : await banUser(banTarget.id);
      
    setIsBanning(false);
    
    if (success) {
      setBanTarget(null);
      refresh(); // Re-fetch pentru a actualiza state-ul vizual
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchStudents.toLowerCase()) ||
      s.nickname?.toLowerCase().includes(searchStudents.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTeachers.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTeachers.toLowerCase())
  );

  const roleBadgeClass = (role: string) => {
    if (role === 'STUDENT') return 'bg-student/10 text-student';
    if (role === 'TEACHER') return 'bg-teacher/10 text-teacher';
    return 'bg-muted text-muted-foreground';
  };




  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage students and teachers on the platform."
        icon={Users}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="btn-brand gap-2"
          >
            <Plus className="h-4 w-4" />
            New User
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* ---- Tabel Studenti ---- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display font-semibold text-foreground">
                Students
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({students.length})
                </span>
              </h2>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchStudents}
                  onChange={(e) => setSearchStudents(e.target.value)}
                  placeholder="Search students..."
                  className="input-branded pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <EmptyState icon={Users} title="No students found" />
            ) : (
              <div className="card-base overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Nickname
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                        Role
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.userId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student.nickname ? `@${student.nickname}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeClass(student.role)}`}
                          >
                            {student.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditStudentTarget(student)}
                              title="Edit student"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setResetTarget({
                                  id: student.userId,
                                  fullName: student.fullName,
                                  role: student.role as Role,
                                  banned: student.banned,
                                })
                              }
                              title="Reset password"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-teacher hover:bg-teacher/10 transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                            {/* NOU: Butonul de Ban/Unban pentru Studenți */}
                            <button
                              onClick={() =>
                                setBanTarget({
                                  id: student.userId,
                                  name: student.fullName,
                                  banned: student.banned,
                                })
                              }
                              title={student.banned ? 'Unban student' : 'Ban student'}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                student.banned
                                  ? 'text-green-600 hover:bg-green-600/10'
                                  : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-600/10'
                              }`}
                            >
                              {student.banned ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: student.userId,
                                  name: student.fullName,
                                })
                              }
                              title="Delete student"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---- Tabel Profesori ---- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display font-semibold text-foreground">
                Teachers
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({teachers.length})
                </span>
              </h2>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTeachers}
                  onChange={(e) => setSearchTeachers(e.target.value)}
                  placeholder="Search teachers..."
                  className="input-branded pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {filteredTeachers.length === 0 ? (
              <EmptyState icon={Users} title="No teachers found" />
            ) : (
              <div className="card-base overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                        Role
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTeachers.map((teacher) => (
                      <tr
                        key={teacher.userId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {teacher.fullName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {teacher.title || '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {teacher.email}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeClass(teacher.role)}`}
                          >
                            {teacher.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditTeacherTarget(teacher)}
                              title="Edit teacher"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setResetTarget({
                                  id: teacher.userId,
                                  fullName: teacher.fullName,
                                  role: teacher.role as Role,
                                  banned: teacher.banned,
                                })
                              }
                              title="Reset password"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-teacher hover:bg-teacher/10 transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                            {/* NOU: Butonul de Ban/Unban pentru Profesori */}
                            <button
                              onClick={() =>
                                setBanTarget({
                                  id: teacher.userId,
                                  name: teacher.fullName,
                                  banned: teacher.banned,
                                })
                              }
                              title={teacher.banned ? 'Unban teacher' : 'Ban teacher'}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                teacher.banned
                                  ? 'text-green-600 hover:bg-green-600/10'
                                  : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-600/10'
                              }`}
                            >
                              {teacher.banned ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: teacher.userId,
                                  name: teacher.fullName,
                                })
                              }
                              title="Delete teacher"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

      <EditStudentModal
        open={!!editStudentTarget}
        student={editStudentTarget}
        onClose={() => setEditStudentTarget(null)}
        onSuccess={refresh}
      />

      <EditTeacherModal
        open={!!editTeacherTarget}
        teacher={editTeacherTarget}
        onClose={() => setEditTeacherTarget(null)}
        onSuccess={refresh}
      />

      <ResetPasswordModal
        open={!!resetTarget}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onSuccess={() => setResetTarget(null)}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete User"
        description={`"${deleteTarget?.name}" will be permanently deleted from the platform.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* NOU: Modalul de confirmare pentru Ban/Unban */}
      <BanConfirmModal
        open={!!banTarget}
        user={banTarget}
        isLoading={isBanning}
        onConfirm={handleToggleBan}
        onClose={() => setBanTarget(null)}
      />
    </div>
  );
};

export default AdminUsersPage;