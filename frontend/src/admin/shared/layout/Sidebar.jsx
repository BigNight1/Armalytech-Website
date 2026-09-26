import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronsUpDown, HardHat, History, LogOut, Moon, Package, Settings, User, UserCog, Users, Wrench } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { getDisplayName, getInitials, getRoleLabel } from '../lib/userDisplay.js';
import { prefetchInventory } from '../../inventory/api/prefetch.js';
import { prefetchTickets, prefetchTechnicians } from '../../tickets/api/prefetch.js';
import { prefetchCashClosings } from '../../cash-closings/api/prefetch.js';
import { prefetchClients } from '../../clients/api/prefetch.js';
import { prefetchStaff } from '../../staff/api/prefetch.js';

// T14: on hover/focus, warm both the route's lazy chunk and its first query
// so the click itself feels instant instead of showing a loading skeleton.
const OPERATION_ITEMS = [
  {
    to: '/admin/inventario',
    label: 'Inventario',
    icon: Package,
    prefetchData: prefetchInventory,
    prefetchChunk: () => import('../../inventory/InventoryPage.jsx'),
  },
  {
    to: '/admin/tickets',
    label: 'Tickets / Taller',
    icon: Wrench,
    prefetchData: prefetchTickets,
    prefetchChunk: () => import('../../tickets/TicketsPage.jsx'),
  },
  {
    to: '/admin/historial',
    label: 'Historial del día',
    icon: History,
    prefetchData: prefetchCashClosings,
    prefetchChunk: () => import('../../cash-closings/CashClosingsPage.jsx'),
  },
  {
    to: '/admin/clientes',
    label: 'Clientes',
    icon: Users,
    prefetchData: prefetchClients,
    prefetchChunk: () => import('../../clients/ClientsPage.jsx'),
  },
];

function NavItem({ item, onNavigate, onPrefetch }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold transition-colors ${
          isActive ? 'bg-side-active text-side-active-ink' : 'text-side-ink hover:bg-side-hover'
        }`
      }
    >
      <Icon size={19} strokeWidth={2} className="shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge}
    </NavLink>
  );
}

/**
 * Admin sidebar: brand block, grouped nav ("Operación" / "Administración"),
 * user block at the bottom that opens a popover menu (Perfil, Configuración,
 * Modo oscuro, Cerrar sesión). Always the dark-navy surface regardless of
 * the admin light/dark theme (see `side.*` tokens in tailwind.config.js).
 */
export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePrefetch = (item) => () => {
    if (item.prefetchData) item.prefetchData(queryClient);
    if (item.prefetchChunk) item.prefetchChunk();
  };

  const isOwner = user?.role === 'owner';
  const email = user?.email ?? '';
  const displayName = getDisplayName(email) || 'Cuenta';
  const initials = getInitials(email) || '--';
  const roleLabel = getRoleLabel(user?.role);

  const goPerfil = () => {
    setMenuOpen(false);
    onNavigate?.();
    navigate('/admin/cuenta?tab=perfil');
  };
  const goConfig = () => {
    setMenuOpen(false);
    onNavigate?.();
    navigate('/admin/cuenta?tab=config');
  };
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <div className="flex h-full w-full flex-col bg-side-bg">
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b-2 border-side-divider px-5">
        <img src="/Armalytech_logo.png" alt="ArmalyTech" className="h-[38px] w-[38px] object-contain" />
        <div className="flex flex-col leading-tight">
          <span className="text-[18px] font-extrabold tracking-tight text-white">ArmalyTech</span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-300">Panel</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-5">
        <span className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-side-muted">
          Operación
        </span>
        {OPERATION_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} onPrefetch={handlePrefetch(item)} />
        ))}

        {isOwner && (
          <>
            <span className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-[0.14em] text-side-muted">
              Administración
            </span>
            <NavItem
              item={{
                to: '/admin/personal',
                label: 'Personal',
                icon: UserCog,
                prefetchData: prefetchStaff,
                prefetchChunk: () => import('../../staff/StaffPage.jsx'),
                // Not the shared `Tag` component: this badge sits on the
                // always-dark sidebar, so it needs the sidebar's own
                // (theme-independent) divider/ink colors, not the
                // light/dark-aware admin tokens `Tag` resolves to.
                badge: (
                  <span className="ml-auto border border-side-divider px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-side-ink">
                    Owner
                  </span>
                ),
              }}
              onNavigate={onNavigate}
              onPrefetch={handlePrefetch({ prefetchData: prefetchStaff, prefetchChunk: () => import('../../staff/StaffPage.jsx') })}
            />
            <NavItem
              item={{
                to: '/admin/tecnicos',
                label: 'Técnicos',
                icon: HardHat,
                prefetchData: prefetchTechnicians,
                prefetchChunk: () => import('../../tickets/TechniciansPage.jsx'),
                badge: (
                  <span className="ml-auto border border-side-divider px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-side-ink">
                    Owner
                  </span>
                ),
              }}
              onNavigate={onNavigate}
              onPrefetch={handlePrefetch({ prefetchData: prefetchTechnicians, prefetchChunk: () => import('../../tickets/TechniciansPage.jsx') })}
            />
          </>
        )}
      </nav>

      <div className="relative shrink-0 border-t-2 border-side-divider">
        {menuOpen && (
          <div className="absolute inset-x-3 bottom-full z-10 mb-2 border border-side-divider bg-side-pop shadow-admin-lg">
            <div className="flex flex-col gap-0.5 border-b-2 border-side-divider px-4 py-3.5">
              <span className="text-[15px] font-bold text-white">{displayName}</span>
              <span className="truncate text-sm text-side-muted">{email}</span>
            </div>
            <div className="flex flex-col py-1.5">
              <button
                type="button"
                onClick={goPerfil}
                className="flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-side-ink hover:bg-side-hover"
              >
                <User size={17} />
                <span>Perfil</span>
              </button>
              <button
                type="button"
                onClick={goConfig}
                className="flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-side-ink hover:bg-side-hover"
              >
                <Settings size={17} />
                <span>Configuración</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-side-ink hover:bg-side-hover"
              >
                <Moon size={17} />
                <span>Modo oscuro</span>
                <span
                  aria-hidden="true"
                  className={`ml-auto flex h-[18px] w-[34px] items-center p-0.5 ${isDark ? 'justify-end bg-accent' : 'justify-start bg-white/25'}`}
                >
                  <span className={`h-[14px] w-[14px] ${isDark ? 'bg-side-bg' : 'bg-side-ink'}`} />
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t-2 border-side-divider px-4 py-3 text-left text-[15px] font-semibold text-red-300 hover:bg-danger-bg"
            >
              <LogOut size={17} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          className="flex h-20 w-full items-center gap-3 px-3 py-0 pl-5 text-left hover:bg-side-hover"
        >
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center bg-accent text-[15px] font-extrabold text-on-accent">
            {initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-bold text-white">{displayName}</span>
            <span className="truncate text-[13px] text-side-muted">{roleLabel}</span>
          </span>
          <ChevronsUpDown size={17} className="shrink-0 text-side-muted" />
        </button>
      </div>
    </div>
  );
}
