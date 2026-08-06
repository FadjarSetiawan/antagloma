import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, ShoppingBag, PlusCircle, User as UserIcon } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role;

  const navItems = [
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
      show: role === 'owner' || role === 'admin' || role === 'sales',
    },
    {
      label: 'Order Baru',
      to: '/orders/create',
      icon: PlusCircle,
      show: role === 'sales' || role === 'admin',
      isCenter: true,
    },
    {
      label: 'Akun',
      to: '/reports',
      icon: UserIcon,
      show: true,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 px-2 py-2.5 flex justify-around items-center shadow-lg">
      {navItems
        .filter((item) => item.show)
        .map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-md border-2 border-white transition-transform active:scale-95">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-800 mt-1">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-emerald-800 font-extrabold' : 'text-slate-500 font-bold hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
    </div>
  );
};
