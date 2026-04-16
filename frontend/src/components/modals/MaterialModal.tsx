import { useState } from 'react';
import { Upload, FileText, Link } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useContent } from '@/hooks/useContent';

const MATERIAL_TYPES = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'word', label: 'Word Document' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'External Link' },
];

// Tipuri de fisiere acceptate per tip selectat
const ACCEPTED_EXTENSIONS: Record<string, string> = {
  pdf: '.pdf',
  word: '.doc,.docx',
  image: '.jpg,.jpeg,.png,.gif',
  audio: '.mp3,.wav',
  video: '.mp4',
  link: '',
};

interface Props {
  open: boolean;
  lessonId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const MaterialModal = ({
  open,
  lessonId,
  onClose,
  onSuccess,
}: Props) => {
  const { uploadAndCreateMaterial, isSaving, error } = useContent();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const isLink = type === 'link';

  const handleClose = () => {
    setTitle('');
    setType('');
    setSelectedFile(null);
    setLinkUrl('');
    onClose();
  };

  const canSubmit = () => {
    if (!title.trim() || !type) return false;
    if (isLink) return linkUrl.trim().length > 0;
    return selectedFile !== null;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    if (isLink) {
      // Per fluxul din README: POST /materials cu URL direct
      const { contentApi } = await import('@/api/contentApi');
      try {
        await contentApi.createMaterial({
          lessonId,
          title: title.trim(),
          type,
          url: linkUrl.trim(),
        });
        onSuccess();
        handleClose();
      } catch {
        // Eroarea e gestionata de useContent
      }
      return;
    }

    const success = await uploadAndCreateMaterial(
      lessonId,
      title.trim(),
      type,
      selectedFile!
    );
    if (success) {
      onSuccess();
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Upload Material</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && <ErrorBanner message={error} />}

          {/* Titlu */}
          <div className="space-y-1.5">
            <Label htmlFor="matTitle">Title</Label>
            <Input
              id="matTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material Title"
              className="input-branded"
            />
          </div>

          {/* Tip */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(val) => {
                setType(val);
                setSelectedFile(null);
                setLinkUrl('');
              }}
            >
              <SelectTrigger className="input-branded">
                <SelectValue placeholder="Select material type..." />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link URL — doar pentru tip link */}
          {isLink && (
            <div className="space-y-1.5">
              <Label htmlFor="linkUrl">URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-branded pl-9"
                />
              </div>
            </div>
          )}

          {/* File picker — pentru toate tipurile exceptand link */}
          {type && !isLink && (
            <div className="space-y-1.5">
              <Label>File</Label>
              <label
                className={`
                  flex cursor-pointer flex-col items-center gap-2 rounded-lg
                  border-2 border-dashed px-4 py-6 transition-colors duration-150
                  ${selectedFile
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50'
                  }
                `}
              >
                {selectedFile ? (
                  <>
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium text-foreground text-center">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to select a file
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {MATERIAL_TYPES.find((t) => t.value === type)?.label}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept={ACCEPTED_EXTENSIONS[type] ?? ''}
                  className="hidden"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="btn-brand"
            disabled={isSaving || !canSubmit()}
          >
            {isSaving ? 'Uploading...' : isLink ? 'Add Link' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};