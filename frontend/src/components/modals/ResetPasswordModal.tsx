import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ResetPasswordModalProps {
  userId: number;
  fullName: string;
  onClose: () => void;
  onSave: (userId: number, newPassword: string) => Promise<void>;
}

const ResetPasswordModal = ({ userId, fullName, onClose, onSave }: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!newPassword.trim()) { setError('Password is required.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave(userId, newPassword);
      onClose();
    } catch {
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
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
          Reset Password
        </h2>
        <p className="text-sm text-gray-500">
          Set a new password for{' '}
          <span className="font-semibold text-gray-800">{fullName}</span>.
        </p>

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

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#0369a1' }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;