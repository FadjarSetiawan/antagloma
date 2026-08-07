import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Package,
  FileText,
  Sprout,
  Users,
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Semua Order',
      to: '/orders',
      icon: ShoppingBag,
      show: role === 'owner' || role === 'admin' || role === 'sales',
    },
    {
      label: 'Buat Order',
      to: '/orders/create',
      icon: PlusCircle,
      show: role === 'sales' || role === 'admin',
    },
    {
      label: 'Antrean Packing',
      to: '/packing',
      icon: Package,
      show: role === 'packing' || role === 'admin' || role === 'owner',
    },
    {
      label: 'Master Produk',
      to: '/master/products',
      icon: Sprout,
      show: role === 'owner' || role === 'admin',
    },
    {
      label: 'Kelola User',
      to: '/users',
      icon: Users,
      show: role === 'owner',
    },
    {
      label: 'Laporan',
      to: '/reports',
      icon: FileText,
      show: role === 'owner',
    },
  ];

  return (
    <aside className="hidden md:block w-64 bg-white border-r-2 border-slate-200 min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1.5">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${
                    isActive
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
};
