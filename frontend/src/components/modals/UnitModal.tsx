import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CourseUnitDto } from '@/types/content';

interface UnitModalProps {
  initial: Partial<CourseUnitDto> | null;
  onClose: () => void;
  onSave: (data: Omit<CourseUnitDto, 'id'>) => Promise<void>;
}

const UnitModal = ({ initial, onClose, onSave }: UnitModalProps) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [hskLevel, setHskLevel] = useState<string>(initial?.hskLevel?.toString() ?? '');
  const [orderIndex, setOrderIndex] = useState<string>(initial?.orderIndex?.toString() ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!orderIndex.trim()) { setError('Order index is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        hskLevel: hskLevel ? parseInt(hskLevel) : null,
        orderIndex: parseInt(orderIndex),
      });
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-md space-y-5"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {initial?.id ? 'Edit Unit' : 'New Unit'}
        </h2>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">HSK Level</label>
              <Input type="number" min={1} max={6} className="h-11 rounded-xl border-gray-200 bg-gray-50" value={hskLevel} onChange={(e) => setHskLevel(e.target.value)} placeholder="1–6" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Index *</label>
              <Input type="number" min={1} className="h-11 rounded-xl border-gray-200 bg-gray-50" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#e85d04' }}
          >
            {loading ? 'Saving...' : 'Save'}
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

export default UnitModal;