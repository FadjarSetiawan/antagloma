import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/shared/AppHeader';
import { AppSidebar } from '../components/shared/AppSidebar';
import { MobileBottomNav } from '../components/shared/MobileBottomNav';

export const DashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-extrabold text-sm">Memuat aplikasi Antagloma Florist...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};
