import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  User as UserIcon,
  LogOut,
  X,
  FileText,
  Sprout,
  PlusCircle,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const role = user?.role;

  const items = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Pesanan',
      to: '/orders',
      icon: ShoppingBag,
      show: role === 'sales' || role === 'admin' || role === 'owner',
    },
    {
      label: 'Antrean',
      to: '/packing',
      icon: Package,
      show: role === 'packing',
    },
    {
      label: 'Komisi',
      to: '/commission',
      icon: Wallet,
      show: role === 'sales' || role === 'admin' || role === 'owner',
    },
  ];

  return (
    <>
      {/* Sticky Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 px-2 py-2 flex items-center justify-around md:hidden shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl text-[10px] transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white font-black shadow-md border-2 border-emerald-900 scale-105'
                      : 'text-slate-600 font-bold hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

        {/* Profile / Menu Trigger */}
        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl text-[10px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span>Profil</span>
        </button>
      </nav>

      {/* Mobile Profile Modal Sheet */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center md:hidden">
          <div className="bg-white rounded-t-3xl border-t-2 border-slate-200 w-full p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{user?.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold uppercase">
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-bold text-slate-800">
              {(role === 'sales' || role === 'admin') && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/orders/create');
                  }}
                  className="w-full p-3 rounded-2xl bg-emerald-800 text-white border-2 border-emerald-900 flex items-center gap-3 font-extrabold shadow-sm"
                >
                  <PlusCircle className="w-5 h-5 text-white" />
                  <span>+ Buat Pesanan Baru</span>
                </button>
              )}

              {(role === 'owner' || role === 'admin') && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/master/products');
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 flex items-center gap-3 text-slate-900"
                >
                  <Sprout className="w-5 h-5 text-emerald-800" />
                  <span>Master Produk Adenium</span>
                </button>
              )}

              {role === 'owner' && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/reports');
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 flex items-center gap-3 text-slate-900"
                >
                  <FileText className="w-5 h-5 text-emerald-800" />
                  <span>Laporan Penjualan</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full p-3 rounded-2xl bg-rose-800 text-white border-2 border-rose-900 flex items-center gap-3 font-extrabold shadow-sm"
              >
                <LogOut className="w-5 h-5 text-white" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
