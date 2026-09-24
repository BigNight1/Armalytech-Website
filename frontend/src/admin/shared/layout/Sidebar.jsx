import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth.js';

const NAV_ITEMS = [
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/historial', label: 'Historial' },
  { to: '/admin/clientes', label: 'Clientes' },
];

const linkClasses = ({ isActive }) =>
  `block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-orange text-white' : 'text-brand-ink hover:bg-slate-800'
  }`;

/** Left sidebar: logo, section nav, and logout. `onNavigate` closes the mobile drawer. */
export default function Sidebar({ onNavigate }) {
  const { logout } = useAuth();

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-800 bg-brand-navy-dark px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img src="/Armalytech_logo.png" alt="ArmalyTech" className="h-10 w-10 object-contain" />
        <span className="text-lg font-semibold text-brand-ink">ArmalyTech</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onNavigate}>
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
