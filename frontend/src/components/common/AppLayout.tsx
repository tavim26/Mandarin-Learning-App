import { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { Navbar } from './Navbar';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/hooks/useAuth';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

interface Props {
  navItems: NavItem[];
  children: React.ReactNode;
}

export const AppLayout = ({ navItems, children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const visibleItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay mobil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          bg-card border-r border-border
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header sidebar */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 font-display font-bold text-primary text-xl hover:opacity-80 transition-opacity"
          >
            漢語
          </button>
          <button
            onClick={closeSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigatie */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-lg px-3 py-2.5
                text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            Chinese Learning Platform
          </p>
        </div>
      </aside>

      {/* Continut principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};