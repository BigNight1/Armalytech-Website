import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import LoginPage from './auth/LoginPage.jsx';
import AdminLayout from './shared/layout/AdminLayout.jsx';
import { ToastProvider } from './shared/ui/index.js';
import InventoryPage from './inventory/InventoryPage.jsx';
import CashClosingsPage from './cash-closings/CashClosingsPage.jsx';

/**
 * Admin sub-router, mounted at `/admin/*` and lazy-loaded from `App.jsx` so
 * the public bundle doesn't grow. `AuthProvider` needs the router context
 * (it navigates on 401/logout), so it lives inside here, not in `App.jsx`.
 */
export default function AdminRoutes() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="inventario" replace />} />
              <Route path="inventario" element={<InventoryPage />} />
              <Route path="historial" element={<CashClosingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="login" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
