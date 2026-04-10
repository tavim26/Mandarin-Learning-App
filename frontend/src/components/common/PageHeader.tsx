import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  actions,
}: Props) => {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <h1 className="page-title">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground pl-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};