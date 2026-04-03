import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LessonMaterialDto } from '@/types/content';

const MATERIAL_TYPES: { value: string; label: string }[] = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'LINK', label: 'Web Link' },
  { value: 'AUDIO', label: 'Audio Track' },
];

interface MaterialModalProps {
  lessonId: number;
  onClose: () => void;
  onSave: (data: Omit<LessonMaterialDto, 'id'>) => Promise<void>;
}

const MaterialModal = ({ lessonId, onClose, onSave }: MaterialModalProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('LINK');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!url.trim()) { setError('URL is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave({ lessonId, title: title.trim(), type: type.trim(), url: url.trim() });
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
          Add Material
        </h2>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type *</label>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {MATERIAL_TYPES.map((t) => (
      <button
        key={t.value}
        onClick={() => setType(t.value)}
        className="text-center p-2 rounded-xl border-2 transition-all"
        style={{
          borderColor: type === t.value ? '#e85d04' : '#e5e7eb',
          background: type === t.value ? '#fff7f0' : '#ffffff',
        }}
      >
        <span className="text-xs font-bold" style={{ color: type === t.value ? '#e85d04' : '#374151' }}>
          {t.label}
        </span>
      </button>
    ))}
  </div>
</div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">URL *</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
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

export default MaterialModal;