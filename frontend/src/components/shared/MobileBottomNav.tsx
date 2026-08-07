import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  Wallet,
  User as UserIcon,
  LogOut,
  X,
  FileText,
  Sprout,
  PlusCircle,
  Users,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const role = user?.role;

  // Define tab items per role
  const allNavItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutGrid,
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

  const visibleNavItems = allNavItems.filter((item) => item.show);

  // Total visible tabs including Profile
  const totalTabs = visibleNavItems.length + 1;

  // Determine current active index
  let activeIndex = visibleNavItems.findIndex((item) => location.pathname.startsWith(item.to));
  if (isProfileOpen) {
    activeIndex = visibleNavItems.length; // Profile tab index
  } else if (activeIndex === -1) {
    activeIndex = 0; // Default to first tab
  }

  return (
    <>
      {/* Sticky Bottom Navigation Bar for Mobile matching reference screenshot pixel-perfect */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative flex items-center justify-around w-full py-2 px-2">
          {/* Smooth Animated Spring Sliding Green Pill Background */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-[26px] bg-[#04593f] shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              width: `calc(${100 / totalTabs}% - 12px)`,
              left: `calc(${(activeIndex * 100) / totalTabs}% + 6px)`,
            }}
          />

          {/* Navigation Items */}
          {visibleNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeIndex === idx && !isProfileOpen;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsProfileOpen(false)}
                className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 text-center transition-colors duration-200 cursor-pointer"
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-[#334155]'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span
                  className={`text-[11px] leading-none transition-colors duration-200 ${
                    isActive ? 'text-white font-extrabold' : 'text-[#334155] font-semibold'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Profile / Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 text-center transition-colors duration-200 cursor-pointer"
          >
            <UserIcon
              className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
                isProfileOpen ? 'text-white' : 'text-[#334155]'
              }`}
              strokeWidth={isProfileOpen ? 2.2 : 1.8}
            />
            <span
              className={`text-[11px] leading-none transition-colors duration-200 ${
                isProfileOpen ? 'text-white font-extrabold' : 'text-[#334155] font-semibold'
              }`}
            >
              Profil
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Profile Modal Sheet */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center md:hidden">
          <div className="bg-white rounded-t-3xl border-t-2 border-slate-200 w-full p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#04593f] text-white flex items-center justify-center font-black">
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
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
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
                  className="w-full p-3 rounded-2xl bg-[#04593f] text-white border-2 border-emerald-950 flex items-center gap-3 font-extrabold shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5 text-white" />
                  <span>+ Buat Pesanan Baru</span>
                </button>
              )}

              {role === 'owner' && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/users');
                  }}
                  className="w-full p-3 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 flex items-center gap-3 text-purple-950 font-black cursor-pointer"
                >
                  <Users className="w-5 h-5 text-purple-900" />
                  <span>Manajemen Akun User Staff</span>
                </button>
              )}

              {(role === 'owner' || role === 'admin') && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/master/products');
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 flex items-center gap-3 text-slate-900 cursor-pointer"
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
                  className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 flex items-center gap-3 text-slate-900 cursor-pointer"
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
                className="w-full p-3 rounded-2xl bg-rose-800 text-white border-2 border-rose-900 flex items-center gap-3 font-extrabold shadow-sm cursor-pointer"
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
