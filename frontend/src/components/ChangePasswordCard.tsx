import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfilePassword } from '@/hooks/useProfile';

interface ChangePasswordCardProps {
  userId: number;
}

// Sectiunea de schimbare parola — identica pentru toate profilurile
const ChangePasswordCard = ({ userId }: ChangePasswordCardProps) => {
  const {
    oldPassword, setOldPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showOldPassword, setShowOldPassword,
    loading, error, success,
    submit,
  } = useProfilePassword(userId);

  return (
    <div
      className="bg-white rounded-2xl p-8 space-y-6"
      style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
    >
      <h2
        className="text-lg font-bold text-gray-900"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Change Password
      </h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <Input
              type={showOldPassword ? 'text' : 'password'}
              placeholder="Current password"
              className="h-11 rounded-xl border-gray-200 bg-gray-50 pr-12"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
              style={{ color: '#9ca3af' }}
            >
              {showOldPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            New Password
          </label>
          <Input
            type="password"
            placeholder="New password"
            className="h-11 rounded-xl border-gray-200 bg-gray-50"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Confirm New Password
          </label>
          <Input
            type="password"
            placeholder="Confirm new password"
            className="h-11 rounded-xl border-gray-200 bg-gray-50"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && (
          <p className="text-xs" style={{ color: '#15803d' }}>
            Password changed successfully.
          </p>
        )}

        <Button
          onClick={submit}
          disabled={loading}
          className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </div>
  );
};

export default ChangePasswordCard;