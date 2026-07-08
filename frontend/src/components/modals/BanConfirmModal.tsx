import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BanConfirmModalProps {
  open: boolean;
  user: { id: number; name: string; banned: boolean } | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const BanConfirmModal = ({ open, user, isLoading, onConfirm, onClose }: BanConfirmModalProps) => {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="card-base w-full max-w-md p-6 shadow-xl bg-background rounded-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-full ${user.banned ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {user.banned ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {user.banned ? 'Unban User' : 'Ban User'}
          </h3>
        </div>
        <p className="text-muted-foreground mb-6 text-sm">
          {user.banned
            ? `Are you sure you want to reactivate "${user.name}"? They will regain access to the platform.`
            : `Are you sure you want to ban "${user.name}"? They will be unable to log in.`}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={user.banned ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
          >
            {isLoading ? 'Processing...' : (user.banned ? 'Yes, Unban' : 'Yes, Ban')}
          </Button>
        </div>
      </div>
    </div>
  );
};