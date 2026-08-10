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
  CheckCircle,
  Percent,
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
      label: 'Kalkulator Komisi',
      to: '/commission',
      icon: Wallet,
      show: role === 'sales',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between hidden md:flex font-sans">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-9 h-9 rounded-xl bg-[#04593f] text-white flex items-center justify-center font-black">
            <Sprout className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white leading-tight">Antagloma Florist</h1>
            <p className="text-[10px] text-slate-400 font-medium">Sales Order Management</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-xs font-bold">
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
                        ? 'bg-[#04593f] text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-2">
          <span className="font-bold text-xs text-white block truncate">{user?.name}</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
            Role: {user?.role}
          </span>
        </div>

        <button
          onClick={logout}
          className="w-full py-2.5 px-3 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
