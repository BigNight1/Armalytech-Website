import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Sidebar from './Sidebar.jsx';
import Header, { SECTION_LABELS } from './Header.jsx';
import { BreadcrumbProvider, useBreadcrumbExtra } from './breadcrumb.jsx';
import MustChangePasswordModal from '../../auth/components/MustChangePasswordModal.jsx';
import { useRealtimeSync } from '../realtime/useRealtimeSync.js';

function AdminPageTitle() {
  const location = useLocation();
  const extra = useBreadcrumbExtra();
  const segment = location.pathname.split('/')[2];
  const section = SECTION_LABELS[segment] ?? 'Panel';
  const title = extra ? `${extra} · ${section} · Armalytech` : `${section} · Armalytech`;

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
}

/**
 * Admin shell: fixed 264px sidebar at `lg` and up, off-canvas drawer below
 * it, plus a header (breadcrumb, Lima clock, theme toggle). `ThemeProvider`
 * (the `.admin-shell` root every token here resolves against) lives higher
 * up, in `AdminRoutes.jsx`, so it also covers the login screen.
 *
 * Only mounted behind `RequireAuth` (see `AdminRoutes.jsx`), so `useRealtimeSync`
 * (ADR 0028) here always has a session; it unmounts — and closes its
 * `EventSource` — the moment `RequireAuth` redirects to `/admin/login`.
 */
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useRealtimeSync();

  return (
    <BreadcrumbProvider>
      <AdminPageTitle />
      <div className="flex min-h-screen bg-bg text-ink">
        {/* Portal target for Glide Data Grid's cell-edit overlay (T15, Historial). */}
        <div id="portal" style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999 }} />
        <MustChangePasswordModal />

        <div className="hidden w-[264px] shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="w-[264px] max-w-[85vw]">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
            <div
              className="flex-1 bg-black/60"
              role="presentation"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* min-w-0 lets tables scroll inside their own overflow-x-auto
            wrappers instead of widening the whole page on phones. */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[264px]">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
