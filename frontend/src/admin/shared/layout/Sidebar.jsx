import { NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/useAuth.js';
import { prefetchInventory } from '../../inventory/api/prefetch.js';
import { prefetchCashClosings } from '../../cash-closings/api/prefetch.js';
import { prefetchClients } from '../../clients/api/prefetch.js';
import { prefetchStaff } from '../../staff/api/prefetch.js';

// T14: on hover/focus, warm both the route's lazy chunk and its first query
// so the click itself feels instant instead of showing a loading skeleton.
const NAV_ITEMS = [
  {
    to: '/admin/inventario',
    label: 'Inventario',
    prefetchData: prefetchInventory,
    prefetchChunk: () => import('../../inventory/InventoryPage.jsx'),
  },
  {
    to: '/admin/historial',
    label: 'Historial',
    prefetchData: prefetchCashClosings,
    prefetchChunk: () => import('../../cash-closings/CashClosingsPage.jsx'),
  },
  {
    to: '/admin/clientes',
    label: 'Clientes',
    prefetchData: prefetchClients,
    prefetchChunk: () => import('../../clients/ClientsPage.jsx'),
  },
];

const linkClasses = ({ isActive }) =>
  `block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-orange text-white' : 'text-brand-ink hover:bg-slate-800'
  }`;

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const handlePrefetch = (item) => () => {
    if (item.prefetchData) item.prefetchData(queryClient);
    if (item.prefetchChunk) item.prefetchChunk();
  };

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.role === 'owner'
      ? [
          {
            to: '/admin/personal',
            label: 'Personal',
            prefetchData: prefetchStaff,
            prefetchChunk: () => import('../../staff/StaffPage.jsx'),
          },
        ]
      : []),
    {
      to: '/admin/cuenta',
      label: 'Cuenta',
      prefetchChunk: () => import('../../account/AccountPage.jsx'),
    },
  ];

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-800 bg-brand-navy-dark px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img src="/Armalytech_logo.png" alt="ArmalyTech" className="h-10 w-10 object-contain" />
        <span className="text-lg font-semibold text-brand-ink">ArmalyTech</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClasses}
            onClick={onNavigate}
            onMouseEnter={handlePrefetch(item)}
            onFocus={handlePrefetch(item)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-brand-ink"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
