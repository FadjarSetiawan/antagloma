import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutGrid,
  ShoppingBag,
  PlusCircle,
  Package,
  FileText,
  Users,
  LogOut,
  Sprout,
  Wallet,
  Percent,
  History,
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutGrid,
      show: true,
    },
    {
      label: 'Order Penjualan',
      to: '/orders',
      icon: ShoppingBag,
      show: true,
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
      show: role === 'admin' || role === 'owner',
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
    { label: 'Commission', to: '/management/commission', icon: Percent, show: role === 'owner' },
    { label: 'Discount', to: '/management/discount', icon: Wallet, show: role === 'owner' },
    {
      label: 'Riwayat Pesanan',
      to: '/orders?status=COMPLETED',
      icon: History,
      show: role === 'sales' || role === 'admin',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 text-slate-700 min-h-screen p-4 flex flex-col justify-between hidden md:flex font-sans shadow-2xs">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 pt-2 border-b border-slate-100 pb-4">
          <img
            src="/antagloma-logo.png"
            alt="Antagloma Florist Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-2xs flex-shrink-0 bg-emerald-50/50 p-1 border border-emerald-100"
          />
          <div className="min-w-0">
            <h1 className="font-heading font-black text-sm text-slate-900 leading-tight truncate">Antagloma Florist</h1>
            <p className="text-xs text-[#04593f] font-semibold leading-snug truncate">Sales Order Management</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-xs font-bold font-heading">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-[#04593f] border border-emerald-200/80 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-semibold'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="px-1 flex items-center justify-between">
          <div className="min-w-0">
            <span className="font-heading font-bold text-xs text-slate-900 block truncate">{user?.name}</span>
            <span className="text-xs text-[#04593f] font-extrabold uppercase tracking-wider block">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-2.5 px-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
