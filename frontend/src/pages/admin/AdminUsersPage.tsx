import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, KeyRound, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { ResetPasswordModal } from '@/components/modals/ResetPasswordModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useUsers } from '@/hooks/useUsers';
import type { UserDto } from '@/hooks/useUsers';

const AdminUsersPage = () => {
  const {
    users,
    isLoading,
    error,
    fetchAllUsers,
    deleteUser,
    searchUsers,
  } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const results = await searchUsers(query.trim());
      setSearchResults(results);
      setIsSearching(false);
    },
    [searchUsers]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteUser(deleteTarget.id);
    setIsDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const displayedUsers =
    searchQuery.trim() ? searchResults : users;

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      STUDENT: 'bg-student/10 text-student',
      TEACHER: 'bg-teacher/10 text-teacher',
      ADMIN: 'bg-muted text-muted-foreground',
    };
    return (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          map[role] ?? 'bg-muted text-muted-foreground'
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Create, edit and manage platform users."
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name..."
          className="input-branded pl-9"
        />
      </div>

      {isLoading || isSearching ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayedUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No users found' : 'No users yet'}
          description={
            searchQuery
              ? `No results for "${searchQuery}".`
              : 'Create the first user to get started.'
          }
        />
      ) : (
        <div className="card-base overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                  ID
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.fullName}
                  </td>
                  <td className="px-4 py-3">
                    {roleBadge(user.role)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    #{user.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(user)}
                        title="Edit name"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setResetTarget(user)}
                        title="Reset password"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-teacher hover:bg-teacher/10 transition-colors"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        title="Delete user"
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

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchAllUsers}
      />

      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={fetchAllUsers}
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
        description={`"${deleteTarget?.fullName}" will be permanently deleted from the platform.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminUsersPage;