import { LogOut, User, Menu } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      {/* Buton meniu mobil */}
      <button
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Logo — vizibil doar pe desktop cand sidebar-ul e collapsat */}
      <div className="hidden md:flex items-center gap-2">
        <span className="font-display font-bold text-primary text-lg">
          漢語
        </span>
        <span className="text-sm text-muted-foreground font-medium">
          Learning Platform
        </span>
      </div>

      {/* Profil dropdown */}
      <div className="ml-auto">
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
          <DropdownMenuContent align="end" className="w-48 animate-scale-in">
            <DropdownMenuItem className="gap-2 cursor-pointer">
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