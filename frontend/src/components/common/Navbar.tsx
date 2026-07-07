import { LogOut, User, Menu, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useEffect } from 'react';

interface Props {
  onMenuToggle?: () => void;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const roleLabel: Record<string, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  ADMIN: 'Administrator',
};

export const Navbar = ({ onMenuToggle }: Props) => {
  const { fullName, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // XP si level
  const { replica, fetchReplica } = useProgress();

  useEffect(() => {
    if (role === 'STUDENT') {
      fetchReplica();
    }
  }, [role, fetchReplica, location.pathname]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <button
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden md:flex items-center gap-2">
        <span className="font-display font-bold text-primary text-lg">漢語</span>
        <span className="text-sm text-muted-foreground font-medium">
          Learning Platform
        </span>
      </div>

      {/* XP + Level badge*/}
      {role === 'STUDENT' && replica && (
        <div className="hidden sm:flex items-center gap-3 ml-auto mr-3">
          <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">
              {replica.xpTotal} XP
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-student/20 bg-student/8 px-3 py-1">
            <span className="text-xs font-bold text-student">
              Level {replica.level}
            </span>
          </div>
        </div>
      )}

      <div className={role === 'STUDENT' && replica ? '' : 'ml-auto'}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-muted"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {fullName ? getInitials(fullName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {fullName ?? 'User'}
                </span>
                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                  {role ? roleLabel[role] : ''}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => navigate('/profile')}
              className="gap-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};