import { useState } from 'react';
import { useAdminUsers, type EditUserForm } from '@/hooks/useUsers';
import type { StudentProfileDto, TeacherProfileDto, CreateUserRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EditUserModal, { type EditForm } from '@/components/modals/EditUserModal';
import CreateUserModal, { type CreateUserForm } from '@/components/modals/CreateUserModal';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';

// ----------------------------------------------------------------
// Componenta tabel — View pur, primeste date si callbacks
// ----------------------------------------------------------------
interface UserTableProps {
  title: string;
  count: number;
  searchValue: string;
  onSearch: (v: string) => void;
  role: 'STUDENT' | 'TEACHER';
  rows: (StudentProfileDto | TeacherProfileDto)[];
  onEdit: (form: EditForm) => void;
  onDelete: (target: { id: number; fullName: string }) => void;
  onResetPassword: (userId: number, fullName: string) => void;
}

const UserTable = ({
  title, count, searchValue, onSearch, role, rows,
  onEdit, onDelete, onResetPassword,
}: UserTableProps) => {
  const avatarColor = role === 'TEACHER' ? '#0369a1' : '#e85d04';

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f3f4f6' }}>
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
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
              <tr key={user.userId} className="transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid #f9fafb' }}>
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
                          onEdit({ userId: user.userId, fullName: user.fullName, email: user.email, type: 'STUDENT' });
                        } else {
                          onEdit({ userId: user.userId, fullName: user.fullName, email: user.email, title: (user as TeacherProfileDto).title ?? '', type: 'TEACHER' });
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                      style={{ color: '#6b7280' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onResetPassword(user.userId, user.fullName)}
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
// Pagina principala
// ----------------------------------------------------------------
const AdminUsers = () => {
  const {
    students, teachers, loading, error,
    editUser, addUser, removeUser, resetPassword,
  } = useAdminUsers();

  // Stare UI — filtre si modals raman in componenta
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; fullName: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<{ userId: number; fullName: string } | null>(null);

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredTeachers = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // Adaptoare EditForm → EditUserForm (tipuri modale vs tipuri hook)
  const handleEdit = async (data: EditForm) => {
    const hookData: EditUserForm = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      type: data.type,
      ...(data.type === 'TEACHER' ? { title: data.title } : {}),
    };
    await editUser(hookData);
    setEditTarget(null);
  };

  const handleCreate = async (data: CreateUserForm) => {
    await addUser(data as CreateUserRequest);
    setShowCreateModal(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await removeUser(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleResetPassword = async (userId: number, newPassword: string) => {
    await resetPassword(userId, newPassword);
    setResetTarget(null);
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

      {editTarget && (
        <EditUserModal initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />
      )}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onSave={handleCreate} />
      )}
      {resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.userId}
          fullName={resetTarget.fullName}
          onClose={() => setResetTarget(null)}
          onSave={handleResetPassword}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete User"
          description={`Are you sure you want to delete ${deleteTarget.fullName}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            User Management
          </h1>
          <p className="text-gray-400 text-sm">{students.length + teachers.length} total users</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-5 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          + New User
        </Button>
      </div>

      <UserTable
        title="Students"
        count={students.length}
        searchValue={studentSearch}
        onSearch={setStudentSearch}
        role="STUDENT"
        rows={filteredStudents}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        onResetPassword={(userId, fullName) => setResetTarget({ userId, fullName })}
      />

      <UserTable
        title="Teachers"
        count={teachers.length}
        searchValue={teacherSearch}
        onSearch={setTeacherSearch}
        role="TEACHER"
        rows={filteredTeachers}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        onResetPassword={(userId, fullName) => setResetTarget({ userId, fullName })}
      />

    </div>
  );
};

export default AdminUsers;