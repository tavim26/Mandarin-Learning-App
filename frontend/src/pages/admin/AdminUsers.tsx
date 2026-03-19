import { useEffect, useState, useCallback } from 'react';
import {
  getAllStudents, getAllTeachers, deleteUser, createUser,
  updateUserName, updateUserEmail, resetUserPassword, updateTeacherTitle,
  type StudentProfileDto, type TeacherProfileDto,
} from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditStudentForm {
  userId: number;
  fullName: string;
  email: string;
  type: 'STUDENT';
}

interface EditTeacherForm {
  userId: number;
  fullName: string;
  email: string;
  title: string;
  type: 'TEACHER';
}

type EditForm = EditStudentForm | EditTeacherForm;

interface CreateForm {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
}

interface ResetPasswordForm {
  userId: number;
  fullName: string;
  newPassword: string;
}

// Props pentru UserTable — definit ca interfata separata
interface UserTableProps {
  title: string;
  count: number;
  searchValue: string;
  onSearch: (v: string) => void;
  role: 'STUDENT' | 'TEACHER';
  rows: (StudentProfileDto | TeacherProfileDto)[];
  onEdit: (form: EditForm) => void;
  onDelete: (target: { id: number; fullName: string }) => void;
  onResetPassword: (form: ResetPasswordForm) => void;
}

// ----------------------------------------------------------------
// UserTable definit IN AFARA AdminUsers — nu se re-creeaza la render
// ----------------------------------------------------------------
const UserTable = ({
  title, count, searchValue, onSearch, role, rows,
  onEdit, onDelete, onResetPassword,
}: UserTableProps) => {
  const avatarColor = role === 'TEACHER' ? '#0369a1' : '#e85d04';

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
    >
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid #f3f4f6' }}
      >
        <div>
          <h2
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{count} total</p>
        </div>
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          className="h-9 rounded-xl border-gray-200 bg-gray-50 w-48 text-sm"
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400 text-sm">No {title.toLowerCase()} found.</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {role === 'STUDENT' ? 'Nickname' : 'Title'}
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr
                key={user.userId}
                className="transition-colors hover:bg-gray-50"
                style={{ borderBottom: '1px solid #f9fafb' }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: avatarColor }}
                    >
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{user.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-400">
                    {role === 'STUDENT'
                      ? ((user as StudentProfileDto).nickname ?? '—')
                      : ((user as TeacherProfileDto).title ?? '—')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-400">#{user.userId}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        if (role === 'STUDENT') {
                          onEdit({
                            userId: user.userId,
                            fullName: user.fullName,
                            email: user.email,
                            type: 'STUDENT',
                          });
                        } else {
                          onEdit({
                            userId: user.userId,
                            fullName: user.fullName,
                            email: user.email,
                            title: (user as TeacherProfileDto).title ?? '',
                            type: 'TEACHER',
                          });
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                      style={{ color: '#6b7280' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onResetPassword({
                        userId: user.userId,
                        fullName: user.fullName,
                        newPassword: '',
                      })}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-blue-50"
                      style={{ color: '#0369a1' }}
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => onDelete({ id: user.userId, fullName: user.fullName })}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-red-50"
                      style={{ color: '#c1121f' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Componenta principala
// ----------------------------------------------------------------
const AdminUsers = () => {
  const [students, setStudents] = useState<StudentProfileDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [createForm, setCreateForm] = useState<CreateForm | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; fullName: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [resetForm, setResetForm] = useState<ResetPasswordForm | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, teachersData] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
      ]);
      setStudents(studentsData);
      setTeachers(teachersData);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredTeachers = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const handleEdit = async () => {
    if (!editForm) return;
    try {
      setEditLoading(true);
      setEditError(null);
      const original = editForm.type === 'STUDENT'
        ? students.find((s) => s.userId === editForm.userId)
        : teachers.find((t) => t.userId === editForm.userId);
      if (original && editForm.fullName !== original.fullName) {
        await updateUserName(editForm.userId, editForm.fullName);
      }
      if (original && editForm.email !== original.email) {
        await updateUserEmail(editForm.userId, editForm.email);
      }
      if (editForm.type === 'TEACHER' && original &&
        editForm.title !== (original as TeacherProfileDto).title) {
        await updateTeacherTitle(editForm.userId, editForm.title);
      }
      await fetchData();
      setEditForm(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('Failed to update user.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm) return;
    try {
      setCreateLoading(true);
      setCreateError(null);
      await createUser(createForm);
      await fetchData();
      setCreateForm(null);
    } catch {
      setCreateError('This email is already registered.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteUser(deleteTarget.id);
      await fetchData();
      setDeleteTarget(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete user.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetForm) return;
    try {
      setResetLoading(true);
      setResetError(null);
      await resetUserPassword(resetForm.userId, resetForm.newPassword);
      setResetForm(null);
    } catch {
      setResetError('Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

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

      {/* Header pagina */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            User Management
          </h1>
          <p className="text-gray-400 text-sm">
            {students.length + teachers.length} total users
          </p>
        </div>
        <Button
          onClick={() => setCreateForm({ fullName: '', email: '', password: '', role: 'STUDENT' })}
          className="h-10 px-5 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          + New User
        </Button>
      </div>

      {/* Tabel studenti */}
      <UserTable
        title="Students"
        count={students.length}
        searchValue={studentSearch}
        onSearch={setStudentSearch}
        role="STUDENT"
        rows={filteredStudents}
        onEdit={setEditForm}
        onDelete={setDeleteTarget}
        onResetPassword={setResetForm}
      />

      {/* Tabel profesori */}
      <UserTable
        title="Teachers"
        count={teachers.length}
        searchValue={teacherSearch}
        onSearch={setTeacherSearch}
        role="TEACHER"
        rows={filteredTeachers}
        onEdit={setEditForm}
        onDelete={setDeleteTarget}
        onResetPassword={setResetForm}
      />

      {/* ---- MODAL EDITARE ---- */}
      {editForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setEditForm(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Edit User
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                <Input
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((p) => p ? { ...p, fullName: e.target.value } : null)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <Input
                  type="email"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => p ? { ...p, email: e.target.value } : null)}
                />
              </div>
              {editForm.type === 'TEACHER' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                  <Input
                    placeholder="e.g. Professor, Dr."
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => p && p.type === 'TEACHER' ? { ...p, title: e.target.value } : p)}
                  />
                </div>
              )}
              {editError && <p className="text-xs text-red-500">{editError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditForm(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleEdit}
                disabled={editLoading}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
                style={{ background: '#e85d04' }}
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL CREARE ---- */}
      {createForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setCreateForm(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              New User
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['STUDENT', 'TEACHER'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCreateForm((p) => p ? { ...p, role: r } : null)}
                      className="h-11 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        borderColor: createForm.role === r ? '#e85d04' : '#e5e7eb',
                        background: createForm.role === r ? '#fff7f0' : '#f9fafb',
                        color: createForm.role === r ? '#e85d04' : '#6b7280',
                      }}
                    >
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                <Input
                  placeholder="Full name"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((p) => p ? { ...p, fullName: e.target.value } : null)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <Input
                  type="email"
                  placeholder="Email address"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => p ? { ...p, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <Input
                  type="password"
                  placeholder="Password"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => p ? { ...p, password: e.target.value } : null)}
                />
              </div>
              {createError && <p className="text-xs text-red-500">{createError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCreateForm(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleCreate}
                disabled={createLoading}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
                style={{ background: '#e85d04' }}
              >
                {createLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL RESET PAROLA ---- */}
      {resetForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setResetForm(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Reset Password
            </h2>
            <p className="text-sm text-gray-500">
              Set a new password for{' '}
              <span className="font-semibold text-gray-800">{resetForm.fullName}</span>.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Password</label>
              <Input
                type="password"
                placeholder="New password"
                className="h-11 rounded-xl border-gray-200 bg-gray-50"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm((p) => p ? { ...p, newPassword: e.target.value } : null)}
              />
            </div>
            {resetError && <p className="text-xs text-red-500">{resetError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setResetForm(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
                style={{ background: '#0369a1' }}
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL STERGERE ---- */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Delete User
            </h2>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">{deleteTarget.fullName}</span>?
              This action cannot be undone.
            </p>
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
                style={{ background: '#c1121f' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;