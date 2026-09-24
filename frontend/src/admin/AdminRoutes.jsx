import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import LoginPage from './auth/LoginPage.jsx';
import AdminLayout from './shared/layout/AdminLayout.jsx';
import { ToastProvider, SkeletonTable } from './shared/ui/index.js';
import { queryClient } from './shared/api/queryClient.js';

// T14: each section is its own lazy chunk (on top of AdminRoutes already
// being lazy-loaded from App.jsx), so switching sections doesn't need to
// load code for the other two. The sidebar prefetches the chunk on
// hover/focus (see Sidebar.jsx) so the click itself feels instant.
const InventoryPage = lazy(() => import('./inventory/InventoryPage.jsx'));
const CashClosingsPage = lazy(() => import('./cash-closings/CashClosingsPage.jsx'));
const ClientsPage = lazy(() => import('./clients/ClientsPage.jsx'));

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-700/50" />
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}

/**
 * Admin sub-router, mounted at `/admin/*` and lazy-loaded from `App.jsx` so
 * the public bundle doesn't grow. `AuthProvider` needs the router context
 * (it navigates on 401/logout), so it lives inside here, not in `App.jsx`.
 * `QueryClientProvider` (T14) wraps everything below it so every feature
 * hook shares the same cache.
 */
export default function AdminRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="inventario" replace />} />
                <Route
                  path="inventario"
                  element={
                    <Suspense fallback={<SectionSkeleton />}>
                      <InventoryPage />
                    </Suspense>
                  }
                />
                <Route
                  path="historial"
                  element={
                    <Suspense fallback={<SectionSkeleton />}>
                      <CashClosingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="clientes"
                  element={
                    <Suspense fallback={<SectionSkeleton />}>
                      <ClientsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
