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

  // -------------------------------------------------------------
  // PACKING ROLE: 3-Item Clean Layout (Dashboard, Packing, Profil)
  // -------------------------------------------------------------
  if (role === 'packing') {
    let packingActiveIndex = 0;
    if (isProfileOpen) {
      packingActiveIndex = 2; // Right slot
    } else if (location.pathname.startsWith('/packing')) {
      packingActiveIndex = 1; // Center floating button
    } else if (location.pathname.startsWith('/dashboard')) {
      packingActiveIndex = 0; // Left slot
    }

    return (
      <>
        <nav className="fixed bottom-3 left-6 right-6 z-40 bg-white rounded-[32px] md:hidden shadow-2xl border border-slate-100 py-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="relative flex items-center justify-between w-full">
            {/* Smooth Animated Sliding Green Active Dot Indicator for 3 Slots */}
            <div
              className="absolute bottom-0 w-2 h-2 rounded-full bg-[#1b8054] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
              style={{
                left: `calc(${(packingActiveIndex * 100) / 3}% + 16.66% - 4px)`,
              }}
            />

            {/* Slot 0: Dashboard */}
            <NavLink
              to="/dashboard"
              onClick={() => setIsProfileOpen(false)}
              className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
            >
              <LayoutGrid
                className={`w-6 h-6 transition-colors duration-200 ${
                  packingActiveIndex === 0 && !isProfileOpen ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
                }`}
                strokeWidth={packingActiveIndex === 0 && !isProfileOpen ? 2.4 : 1.8}
              />
            </NavLink>

            {/* Slot 1: Center Floating Tanaman/Packing Circle Button */}
            <div className="relative flex justify-center flex-1 z-20 -mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/packing');
                }}
                className={`w-14 h-14 rounded-full bg-[#1b8054] text-white flex items-center justify-center shadow-lg border-4 border-slate-50 active:scale-95 transition-transform cursor-pointer ${
                  packingActiveIndex === 1 ? 'ring-4 ring-[#1b8054]/20 scale-105' : ''
                }`}
                title="Antrean Packing Tanaman"
              >
                <Sprout className="w-7 h-7 text-white" />
              </button>
            </div>

            {/* Slot 2: Profil Trigger */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
            >
              <UserIcon
                className={`w-6 h-6 transition-colors duration-200 ${
                  isProfileOpen ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
                }`}
                strokeWidth={isProfileOpen ? 2.4 : 1.8}
              />
            </button>
          </div>
        </nav>

        {/* Mobile Profile Modal Sheet for Packing */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center md:hidden">
            <div className="bg-white rounded-t-3xl border-t-2 border-slate-200 w-full p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1b8054] text-white flex items-center justify-center font-black">
                    {user?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{user?.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold uppercase">
                      PETUGAS PACKING
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
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/packing');
                  }}
                  className="w-full p-3 rounded-2xl bg-[#1b8054] text-white border-2 border-emerald-950 flex items-center gap-3 font-extrabold shadow-sm cursor-pointer"
                >
                  <Package className="w-5 h-5 text-white" />
                  <span>Antrean Packing Tanaman</span>
                </button>

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
  }

  // -------------------------------------------------------------
  // OTHER ROLES (Sales, Admin, Owner): Tailored 5-Slot Layouts
  // -------------------------------------------------------------
  let rightTab3 = { label: 'Komisi', to: '/commission', icon: Wallet };
  let centerTab = { label: 'Buat Order', to: '/orders/create', icon: Plus };

  if (role === 'admin') {
    rightTab3 = { label: 'Packing', to: '/packing', icon: Package };
    centerTab = { label: 'Buat Order', to: '/orders/create', icon: Plus };
  } else if (role === 'owner') {
    rightTab3 = { label: 'Laporan', to: '/reports', icon: FileText };
    centerTab = { label: 'Kelola User', to: '/users', icon: Users };
  }

  // Determine active index among 5 slots (0: Dashboard, 1: Orders, 2: Center, 3: RightFeature, 4: Profile)
  let activeIndex = 0;
  if (isProfileOpen) {
    activeIndex = 4;
  } else if (
    (role === 'owner' && location.pathname.startsWith('/users')) ||
    ((role === 'sales' || role === 'admin') && location.pathname.startsWith('/orders/create'))
  ) {
    activeIndex = 2; // Center floating button
  } else if (
    (role === 'owner' && location.pathname.startsWith('/reports')) ||
    (role === 'admin' && location.pathname.startsWith('/packing')) ||
    (role === 'sales' && location.pathname.startsWith('/commission'))
  ) {
    activeIndex = 3;
  } else if (location.pathname.startsWith('/orders')) {
    activeIndex = 1;
  } else if (location.pathname.startsWith('/dashboard')) {
    activeIndex = 0;
  }

  const handleCenterAction = () => {
    setIsProfileOpen(false);
    navigate(centerTab.to);
  };

  const CenterIcon = centerTab.icon;
  const Right3Icon = rightTab3.icon;

  return (
    <>
      <nav className="fixed bottom-3 left-3 right-3 z-40 bg-white rounded-[32px] md:hidden shadow-2xl border border-slate-100 py-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative flex items-center justify-between w-full">
          {/* Smooth Animated Sliding Green Active Dot Indicator for 5 Slots */}
          <div
            className="absolute bottom-0 w-2 h-2 rounded-full bg-[#1b8054] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              left: `calc(${(activeIndex * 100) / 5}% + 10% - 4px)`,
            }}
          />

          {/* Slot 0: Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={() => setIsProfileOpen(false)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <LayoutGrid
              className={`w-6 h-6 transition-colors duration-200 ${
                activeIndex === 0 && !isProfileOpen ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={activeIndex === 0 && !isProfileOpen ? 2.4 : 1.8}
            />
          </NavLink>

          {/* Slot 1: Pesanan */}
          <NavLink
            to="/orders"
            onClick={() => setIsProfileOpen(false)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <ShoppingBag
              className={`w-6 h-6 transition-colors duration-200 ${
                activeIndex === 1 && !isProfileOpen ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={activeIndex === 1 && !isProfileOpen ? 2.4 : 1.8}
            />
          </NavLink>

          {/* Slot 2: Center Floating Action Button (Dynamic Per Role) */}
          <div className="relative flex justify-center flex-1 z-20 -mt-6">
            <button
              type="button"
              onClick={handleCenterAction}
              className={`w-14 h-14 rounded-full bg-[#1b8054] text-white flex items-center justify-center shadow-lg border-4 border-slate-50 active:scale-95 transition-transform cursor-pointer ${
                activeIndex === 2 ? 'ring-4 ring-[#1b8054]/20 scale-105' : ''
              }`}
              title={centerTab.label}
            >
              <CenterIcon className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Slot 3: Right Feature (Komisi / Packing / Laporan) */}
          <NavLink
            to={rightTab3.to}
            onClick={() => setIsProfileOpen(false)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-colors cursor-pointer"
          >
            <Right3Icon
              className={`w-6 h-6 transition-colors duration-200 ${
                activeIndex === 3 && !isProfileOpen ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
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
                isProfileOpen ? 'text-[#1b8054]' : 'text-slate-400 hover:text-slate-600'
              }`}
              strokeWidth={isProfileOpen ? 2.4 : 1.8}
            />
          </button>
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
