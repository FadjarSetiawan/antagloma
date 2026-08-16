import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OwnerDashboard } from './pages/dashboard/OwnerDashboard';
import { SalesDashboard } from './pages/dashboard/SalesDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { OrderListPage } from './pages/orders/OrderListPage';
import { OrderCreatePage } from './pages/orders/OrderCreatePage';
import { AdminVerificationPage } from './pages/orders/AdminVerificationPage';
import { PackingQueuePage } from './pages/packing/PackingQueuePage';
import { DocumentPrintingPage } from './pages/documents/DocumentPrintingPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { MasterProductsPage } from './pages/master/MasterProductsPage';
import { SalesCommissionPage } from './pages/sales/SalesCommissionPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { ManagementPage } from './pages/owner/ManagementPage';
import { PrintBridgeFallbackPage } from './pages/documents/PrintBridgeFallbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RoleDashboardRouter: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'owner') return <OwnerDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'sales') return <SalesDashboard />;
  return <AdminDashboard />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/print-jobs/:jobId" element={<PrintBridgeFallbackPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<RoleDashboardRouter />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/create" element={<OrderCreatePage />} />
              <Route path="orders/verification" element={<AdminVerificationPage />} />
              <Route path="commission" element={<SalesCommissionPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="packing" element={<PackingQueuePage />} />
              <Route path="documents/print" element={<DocumentPrintingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="master/products" element={<MasterProductsPage />} />
              <Route path="management/commission" element={<ManagementPage section="commission" />} />
              <Route path="management/discount" element={<ManagementPage section="discount" />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
