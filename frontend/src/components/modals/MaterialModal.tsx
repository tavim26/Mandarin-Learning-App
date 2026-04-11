import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText } from 'lucide-react';
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
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useContent } from '@/hooks/useContent';

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  type: z.string().min(1, 'Type is required.'),
});

type FormData = z.infer<typeof schema>;

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'document' },
  });

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) return;
    const success = await uploadAndCreateMaterial(
      lessonId,
      data.title,
      data.type,
      selectedFile
    );
    if (success) {
      onSuccess();
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-display">Upload Material</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {error && <ErrorBanner message={error} />}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g. Vocabulary List PDF"
              className="input-branded"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              {...register('type')}
              placeholder="e.g. document, audio, video"
              className="input-branded"
            />
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* File picker */}
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
                  <span className="text-sm font-medium text-foreground">
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
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {!selectedFile && (
              <p className="text-xs text-muted-foreground">
                Supported: images, PDF, Word, audio, video
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-brand"
              disabled={isSaving || !selectedFile}
            >
              {isSaving ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};