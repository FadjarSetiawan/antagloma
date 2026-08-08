import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutGrid,
  ShoppingBag,
  Plus,
  Wallet,
  User as UserIcon,
  Package,
  FileText,
  Users,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const role = user?.role;

  // Active slots for Sales, Admin, Owner
  let rightTab3 = { label: 'Komisi', to: '/commission', icon: Wallet };
  let centerTab = { label: 'Buat Order', to: '/orders/create', icon: Plus };

  if (role === 'admin') {
    rightTab3 = { label: 'Packing', to: '/packing', icon: Package };
    centerTab = { label: 'Buat Order', to: '/orders/create', icon: Plus };
  } else if (role === 'owner') {
    rightTab3 = { label: 'Laporan', to: '/reports', icon: FileText };
    centerTab = { label: 'Kelola User', to: '/users', icon: Users };
  }

  // Determine active index among 5 slots
  let activeIndex = 0;
  if (isProfileOpen) {
    activeIndex = 4;
  } else if (
    (role === 'owner' && location.pathname.startsWith('/users')) ||
    ((role === 'sales' || role === 'admin') && location.pathname.startsWith('/orders/create'))
  ) {
    activeIndex = 2;
  } else if (
    (role === 'owner' && location.pathname.startsWith('/reports')) ||
    (role === 'admin' && location.pathname.startsWith('/packing')) ||
    (role === 'sales' && location.pathname.startsWith('/commission'))
  ) {
    activeIndex = 3;
  } else if (location.pathname.startsWith('/orders')) {
    activeIndex = 1;
  }

  const CenterIcon = centerTab.icon;
  const Right3Icon = rightTab3.icon;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg md:hidden font-sans">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2 relative">
          {/* Slot 0: Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={() => setIsProfileOpen(false)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <LayoutGrid
              className={`w-6 h-6 transition-colors duration-200 ${
                activeIndex === 0 && !isProfileOpen ? 'text-[#04593f]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={activeIndex === 0 && !isProfileOpen ? 2.4 : 1.8}
            />
          </NavLink>

          {/* Slot 1: Orders */}
          <NavLink
            to="/orders"
            onClick={() => setIsProfileOpen(false)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <ShoppingBag
              className={`w-6 h-6 transition-colors duration-200 ${
                activeIndex === 1 && !isProfileOpen ? 'text-[#04593f]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={activeIndex === 1 && !isProfileOpen ? 2.4 : 1.8}
            />
          </NavLink>

          {/* Slot 2: Center Action Floating Circle Button */}
          <div className="relative flex justify-center flex-1 z-20 -mt-6">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                navigate(centerTab.to);
              }}
              className={`w-14 h-14 rounded-full bg-[#04593f] text-white flex items-center justify-center shadow-lg border-4 border-slate-50 active:scale-95 transition-transform cursor-pointer ${
                activeIndex === 2 ? 'ring-4 ring-emerald-700/20 scale-105' : ''
              }`}
              title={centerTab.label}
            >
              <CenterIcon className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Slot 3: Right Special Feature */}
          <NavLink
            to={rightTab3.to}
            onClick={() => setIsProfileOpen(false)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <Right3Icon
              className={`w-6 h-6 transition-colors duration-200 ${
                activeIndex === 3 && !isProfileOpen ? 'text-[#04593f]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={activeIndex === 3 && !isProfileOpen ? 2.4 : 1.8}
            />
          </NavLink>

          {/* Slot 4: Profil Trigger */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <UserIcon
              className={`w-6 h-6 transition-colors duration-200 ${
                isProfileOpen ? 'text-[#04593f]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={isProfileOpen ? 2.4 : 1.8}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Profile Modal Sheet */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-end justify-center md:hidden font-sans">
          <div className="bg-white rounded-t-3xl border-t border-slate-200 w-full p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-24">
            {/* User Profile Info Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#04593f] to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#04593f] font-bold uppercase tracking-wider border border-emerald-200">
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Options List */}
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              {(role === 'sales' || role === 'admin') && (
                <div
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/orders/create');
                  }}
                  className="p-3.5 rounded-2xl bg-[#04593f] text-white flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-2xs font-bold"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-4 h-4 text-white" />
                    <span>Buat Order Penjualan Baru</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-200" />
                </div>
              )}

              {role === 'sales' && (
                <div
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/commission');
                  }}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center border border-emerald-100">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span>Kalkulator Komisi Sales</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              )}

              {role === 'admin' && (
                <div
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/packing');
                  }}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center border border-emerald-100">
                      <Package className="w-4 h-4" />
                    </div>
                    <span>Antrean Packing Kebun</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              )}

              {role === 'owner' && (
                <>
                  <div
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/users');
                    }}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center border border-emerald-100">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>Manajemen Akun User Staff</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/reports');
                    }}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center border border-emerald-100">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span>Laporan Penjualan Toko</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </>
              )}

              <div
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center justify-between cursor-pointer transition-colors mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-2xs">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Keluar (Logout)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
