import { Menu, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LimaClock from './LimaClock.jsx';
import { useBreadcrumbExtra } from './breadcrumb.jsx';
import { useTheme } from '../theme/ThemeProvider.jsx';

// First `/admin/<segment>` path piece -> breadcrumb section label. Feature
// pages don't need to touch this; use `useBreadcrumb('Sub label')` (see
// breadcrumb.jsx) for anything past the section itself.
const SECTION_LABELS = {
  inventario: 'Inventario',
  historial: 'Historial de caja',
  clientes: 'Clientes',
  personal: 'Personal',
  cuenta: 'Mi cuenta',
};

/** Admin header: mobile menu button, breadcrumb, Lima clock, theme toggle. */
export default function Header({ onOpenSidebar }) {
  const location = useLocation();
  const extra = useBreadcrumbExtra();
  const { isDark, toggleTheme } = useTheme();

  const segment = location.pathname.split('/')[2];
  const section = SECTION_LABELS[segment] ?? 'Panel';

  return (
    <header className="flex h-[76px] shrink-0 items-center gap-4 border-b-2 border-line px-4 sm:px-6 lg:px-10">
      <button
        type="button"
        className="grid h-10 w-10 shrink-0 place-items-center border border-line text-ink lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className="flex min-w-0 items-center gap-2.5 text-[15px]">
        <span className="text-muted">Panel</span>
        <span className="text-muted">/</span>
        <span className="truncate font-bold text-ink">{section}</span>
        {extra && (
          <>
            <span className="text-muted">/</span>
            <span className="truncate font-bold text-ink">{extra}</span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        <div className="hidden sm:block">
          <LimaClock />
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          className="grid h-[42px] w-[42px] shrink-0 place-items-center border border-line text-ink hover:border-accent hover:text-accent-ink"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
