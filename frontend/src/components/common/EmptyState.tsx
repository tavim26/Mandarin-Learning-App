import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: Props) => {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-foreground">
          {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="btn-brand mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};