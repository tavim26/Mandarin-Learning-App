import { X, AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorBanner = ({ message, onDismiss, className = '' }: Props) => {
  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 rounded-lg border border-destructive/30
        bg-destructive/8 px-4 py-3 text-sm text-destructive
        animate-fade-in ${className}
      `}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};