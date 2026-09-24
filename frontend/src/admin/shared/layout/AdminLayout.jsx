import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import LimaClock from './LimaClock.jsx';

/**
 * Admin shell: fixed sidebar on desktop, collapsible drawer on mobile, plus
 * a header with the live Lima clock on the left.
 */
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-navy text-brand-ink">
      {/* Portal target for Glide Data Grid's cell-edit overlay (T15, Historial). */}
      <div id="portal" style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999 }} />

      <div className="hidden w-64 shrink-0 md:fixed md:inset-y-0 md:left-0 md:flex md:w-64">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/60"
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="flex items-center gap-4 border-b border-slate-800 bg-brand-navy-dark px-4 py-3 md:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-brand-ink hover:bg-slate-800 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            &#9776;
          </button>
          <LimaClock />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
