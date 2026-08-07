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
  Plus,
  Users,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const role = user?.role;

  // 5 Tab Layout setup with Floating Center Action Button
  const leftTabs = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutGrid,
    },
    {
      label: 'Pesanan',
      to: role === 'packing' ? '/packing' : '/orders',
      icon: role === 'packing' ? Package : ShoppingBag,
    },
  ];

  const rightTabs = [
    {
      label: 'Komisi',
      to: role === 'packing' ? '/dashboard' : '/commission',
      icon: role === 'packing' ? LayoutGrid : Wallet,
    },
    {
      label: 'Profil',
      to: '#profile',
      icon: UserIcon,
      isProfile: true,
    },
  ];

  // Determine active index among 5 slots (0: Tab1, 1: Tab2, 2: Center, 3: Tab3, 4: Tab4)
  let activeIndex = 0;
  if (isProfileOpen) {
    activeIndex = 4;
  } else if (location.pathname === '/orders/create' || location.pathname === '/master/products') {
    activeIndex = 2; // Center floating button
  } else if (location.pathname.startsWith('/commission')) {
    activeIndex = 3;
  } else if (location.pathname.startsWith('/orders') || location.pathname.startsWith('/packing')) {
    activeIndex = 1;
  } else if (location.pathname.startsWith('/dashboard')) {
    activeIndex = 0;
  }

  const handleCenterAction = () => {
    setIsProfileOpen(false);
    if (role === 'sales' || role === 'admin') {
      navigate('/orders/create');
    } else if (role === 'owner') {
      navigate('/orders/create');
    } else {
      navigate('/packing');
    }
  };

  return (
    <>
      {/* Curved Cutout Floating Bottom Navigation Bar for Mobile matching reference GIF image */}
      <nav className="fixed bottom-3 left-3 right-3 z-40 bg-white rounded-[32px] md:hidden shadow-2xl border border-slate-100 py-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative flex items-center justify-between w-full">
          {/* Smooth Animated Sliding Green Active Dot Indicator (•) */}
          <div
            className="absolute bottom-0 w-2 h-2 rounded-full bg-[#1b8054] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              left: `calc(${(activeIndex * 100) / 5}% + 10% - 4px)`,
            }}
          />

          {/* Left Tabs (Index 0 & 1) */}
          {leftTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeIndex === idx && !isProfileOpen;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => setIsProfileOpen(false)}
                className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-200 cursor-pointer"
              >
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              </NavLink>
            );
          })}

          {/* Center Floating Green Action Button (Index 2) */}
          <div className="relative flex justify-center flex-1 z-20 -mt-6">
            <button
              type="button"
              onClick={handleCenterAction}
              className={`w-14 h-14 rounded-full bg-[#1b8054] text-white flex items-center justify-center shadow-lg border-4 border-slate-50 active:scale-95 transition-transform cursor-pointer ${
                activeIndex === 2 ? 'ring-4 ring-[#1b8054]/20 scale-105' : ''
              }`}
              title="Buat Order Baru"
            >
              <Sprout className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Right Tabs (Index 3 & 4) */}
          {rightTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const slotIndex = idx + 3; // Slots 3 and 4
            const isActive = activeIndex === slotIndex;

            if (tab.isProfile) {
              return (
                <button
                  key="profile-trigger"
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-200 cursor-pointer"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                </button>
              );
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => setIsProfileOpen(false)}
                className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-200 cursor-pointer"
              >
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Profile Modal Sheet */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center md:hidden">
          <div className="bg-white rounded-t-3xl border-t-2 border-slate-200 w-full p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1b8054] text-white flex items-center justify-center font-black">
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
                  className="w-full p-3 rounded-2xl bg-[#1b8054] text-white border-2 border-emerald-950 flex items-center gap-3 font-extrabold shadow-sm cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-white" />
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
