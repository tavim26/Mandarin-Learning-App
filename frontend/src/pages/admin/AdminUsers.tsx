import { useEffect, useState, useCallback } from 'react';
import { getAllUsers, deleteUser, createUser, updateUserName, type UserDto } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Tipul pentru formularul de creare utilizator
interface CreateUserForm {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
}

// Tipul pentru formularul de redenumire
interface RenameForm {
  userId: number;
  newName: string;
}

// Optiunile de filtrare dupa rol
const ROLE_FILTERS = ['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

const AdminUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtrare
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal creare utilizator
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    fullName: '', email: '', password: '', role: 'STUDENT',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal redenumire
  const [renameForm, setRenameForm] = useState<RenameForm | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);

  // Modal confirmare stergere
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Incarca toti utilizatorii
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtreaza utilizatorii dupa rol si searchQuery
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Sterge un utilizator
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Creeaza un utilizator nou
  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      setCreateError(null);
      const newUser = await createUser(createForm);
      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', password: '', role: 'STUDENT' });
    } catch {
      setCreateError('This email is already registered.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Redenumeste un utilizator
  const handleRename = async () => {
    if (!renameForm) return;
    try {
      setRenameLoading(true);
      setRenameError(null);
      const updated = await updateUserName(renameForm.userId, renameForm.newName);
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setRenameForm(null);
    } catch {
      setRenameError('Failed to update name.');
    } finally {
      setRenameLoading(false);
    }
  };

  // Culori badge per rol
  const roleBadgeStyle = (role: string) => {
    if (role === 'ADMIN') return { background: '#fff7f0', color: '#e85d04' };
    if (role === 'TEACHER') return { background: '#f0f9ff', color: '#0369a1' };
    return { background: '#f0fdf4', color: '#15803d' };
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            User Management
          </h1>
          <p className="text-gray-400 text-sm">
            {users.length} total users
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-5 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          + New User
        </Button>
      </div>

      {/* Filtre */}
      <div
        className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
      >
        {/* Search */}
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 rounded-xl border-gray-200 bg-gray-50 flex-1"
        />

        {/* Filtre rol */}
        <div className="flex gap-2">
          {ROLE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setRoleFilter(filter)}
              className="px-4 h-10 rounded-xl text-sm font-medium transition-all"
              style={{
                background: roleFilter === filter ? '#e85d04' : '#f9fafb',
                color: roleFilter === filter ? 'white' : '#6b7280',
                border: '1px solid',
                borderColor: roleFilter === filter ? '#e85d04' : '#e5e7eb',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel utilizatori */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 text-sm">No users found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{ borderBottom: '1px solid #f9fafb' }}
                >
                  {/* Avatar si nume */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: '#e85d04' }}
                      >
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {user.fullName}
                      </span>
                    </div>
                  </td>

                  {/* Badge rol */}
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md"
                      style={roleBadgeStyle(user.role)}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* ID */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400">#{user.id}</span>
                  </td>

                  {/* Actiuni */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setRenameForm({ userId: user.id, newName: user.fullName })}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                        style={{ color: '#6b7280' }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
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

      {/* ---- MODAL CREARE UTILIZATOR ---- */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-md space-y-5"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Create New User
            </h2>

            <div className="space-y-4">

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  placeholder="Full name"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </label>
                <Input
                  placeholder="Email address"
                  type="email"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <Input
                  placeholder="Password"
                  type="password"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>

              {/* Selectare rol */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['STUDENT', 'TEACHER'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, role: r }))}
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

              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}

            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
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

      {/* ---- MODAL REDENUMIRE ---- */}
      {renameForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setRenameForm(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Rename User
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                New Name
              </label>
              <Input
                className="h-11 rounded-xl border-gray-200 bg-gray-50"
                value={renameForm.newName}
                onChange={(e) => setRenameForm((p) => p ? { ...p, newName: e.target.value } : null)}
              />
            </div>

            {renameError && (
              <p className="text-xs text-red-500">{renameError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRenameForm(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleRename}
                disabled={renameLoading}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
                style={{ background: '#e85d04' }}
              >
                {renameLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ---- MODAL CONFIRMARE STERGERE ---- */}
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
            <h2
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Delete User
            </h2>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">{deleteTarget.fullName}</span>?
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
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