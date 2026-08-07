import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon, Sprout, Menu, X, LayoutDashboard, ShoppingBag, PlusCircle, Package, FileText, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = user?.role;

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, show: true },
    { label: 'Semua Order', to: '/orders', icon: ShoppingBag, show: role === 'owner' || role === 'admin' || role === 'sales' },
    { label: 'Buat Order', to: '/orders/create', icon: PlusCircle, show: role === 'sales' || role === 'admin' },
    { label: 'Komisi Saya', to: '/commission', icon: Wallet, show: role === 'sales' || role === 'admin' || role === 'owner' },
    { label: 'Antrean Packing', to: '/packing', icon: Package, show: role === 'packing' || role === 'admin' || role === 'owner' },
    { label: 'Master Produk', to: '/master/products', icon: Sprout, show: role === 'owner' || role === 'admin' },
    { label: 'Laporan', to: '/reports', icon: FileText, show: role === 'owner' },
  ];

  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-30">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
            <Sprout className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 block leading-tight text-sm md:text-base">Antagloma Florist</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-800">
            <UserIcon className="w-4 h-4 text-slate-500" />
            <span className="font-extrabold text-slate-900">{user?.name}</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-extrabold uppercase tracking-wider shadow-xs">
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200 font-bold text-xs"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-100 border-t border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs font-bold text-slate-800">
            <span>Petugas: {user?.name}</span>
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-extrabold uppercase text-[10px]">{user?.role}</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${
                        isActive
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-200'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                );
              })}
          </div>
        </div>
      )}
    </header>
  );
};
