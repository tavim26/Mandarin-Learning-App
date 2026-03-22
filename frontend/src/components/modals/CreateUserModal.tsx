import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CreateUserForm {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
}

interface CreateUserModalProps {
  onClose: () => void;
  onSave: (data: CreateUserForm) => Promise<void>;
}

const CreateUserModal = ({ onClose, onSave }: CreateUserModalProps) => {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave({ fullName: fullName.trim(), email: email.trim(), password, role });
      onClose();
    } catch {
      setError('This email is already registered.');
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
          New User
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['STUDENT', 'TEACHER'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="h-11 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: role === r ? '#e85d04' : '#e5e7eb',
                    background: role === r ? '#fff7f0' : '#f9fafb',
                    color: role === r ? '#e85d04' : '#6b7280',
                  }}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Full Name
            </label>
            <Input
              placeholder="Full name"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </label>
            <Input
              type="email"
              placeholder="Email address"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Password
            </label>
            <Input
              type="password"
              placeholder="Password"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

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
            style={{ background: '#e85d04' }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;