import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sprout, Bell, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';

export const AppHeader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 15000, // Auto-check for new notifications every 15s
  });

  const unreadCount = notifData?.unread_count || 0;

  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Brand Title Aligned Full Left */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src="/logo.png"
            alt="Antagloma Florist Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-xs flex-shrink-0 group-hover:opacity-90 transition-opacity"
          />
          <div>
            <span className="font-extrabold text-slate-900 block leading-tight text-base sm:text-lg tracking-tight">
              Antagloma Florist
            </span>
          </div>
        </div>

        {/* Right Section: User Profile Pill & Notification Bell */}
        <div className="flex items-center gap-3">
          {/* User Info Tag (Desktop) */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-800 font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <UserIcon className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-slate-900">{user?.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase font-extrabold">
              {user?.role}
            </span>
          </div>

          {/* Notification Bell Icon Button with Red Badge */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Lihat Notifikasi"
            aria-label="Lihat Notifikasi"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 border-2 border-white text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
