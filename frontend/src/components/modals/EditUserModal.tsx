import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface EditStudentForm {
  userId: number;
  fullName: string;
  email: string;
  type: 'STUDENT';
}

export interface EditTeacherForm {
  userId: number;
  fullName: string;
  email: string;
  title: string;
  type: 'TEACHER';
}

export type EditForm = EditStudentForm | EditTeacherForm;

interface EditUserModalProps {
  initial: EditForm;
  onClose: () => void;
  onSave: (data: EditForm) => Promise<void>;
}

const EditUserModal = ({ initial, onClose, onSave }: EditUserModalProps) => {
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [title, setTitle] = useState(
    initial.type === 'TEACHER' ? initial.title : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      const data: EditForm = initial.type === 'TEACHER'
        ? { userId: initial.userId, fullName: fullName.trim(), email: email.trim(), title: title.trim(), type: 'TEACHER' }
        : { userId: initial.userId, fullName: fullName.trim(), email: email.trim(), type: 'STUDENT' };
      await onSave(data);
      onClose();
    } catch {
      setError('Failed to update user.');
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
          Edit User
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Full Name
            </label>
            <Input
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
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {initial.type === 'TEACHER' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Title
              </label>
              <Input
                placeholder="e.g. Professor, Dr."
                className="h-11 rounded-xl border-gray-200 bg-gray-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}
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
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;