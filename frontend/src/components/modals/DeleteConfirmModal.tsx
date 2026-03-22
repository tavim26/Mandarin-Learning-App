import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

const DeleteConfirmModal = ({ title, description, onConfirm, onClose }: DeleteConfirmModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-500">{description}</p>
        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#c1121f' }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;