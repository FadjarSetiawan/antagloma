import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, AppNotification } from '../../services/notificationService';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Clock,
  ShoppingBag,
  Package,
  Send,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const allNotifications = data?.data || [];
  const unreadCount = data?.unread_count || 0;

  const filteredNotifications = allNotifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'ORDER_CREATED':
        return <ShoppingBag className="w-4 h-4 text-amber-700" />;
      case 'ORDER_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'PACKING_COMPLETED':
        return <Package className="w-4 h-4 text-blue-700" />;
      case 'SHIPMENT_COMPLETED':
        return <Send className="w-4 h-4 text-[#04593f]" />;
      default:
        return <Bell className="w-4 h-4 text-[#04593f]" />;
    }
  };

  const getNotifIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'ORDER_CREATED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ORDER_APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PACKING_COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHIPMENT_COMPLETED':
        return 'bg-emerald-50 text-[#04593f] border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24 font-sans text-slate-900 px-1 sm:px-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-1 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm font-bold"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
              <span>Notifikasi Aktivitas</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black">
                  {unreadCount} Baru
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Pantau jalannya proses transaksi dan aktivitas toko real-time
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tandai Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-2xs font-bold text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-emerald-50 text-[#04593f] shadow-2xs border border-emerald-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Semua ({allNotifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-emerald-50 text-[#04593f] shadow-2xs border border-emerald-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Belum Dibaca ({unreadCount})</span>
        </button>
      </div>

      {/* Streamlined Timeline-Style Notifications List (Clean & No Heavy Box Overlap) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-normal text-slate-400">
            Memuat aktivitas notifikasi...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#04593f]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tidak ada notifikasi baru</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xs mx-auto">
                {filter === 'unread' ? 'Semua notifikasi aktivitas telah dibaca.' : 'Belum ada notifikasi aktivitas transaksi.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/85">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`py-3.5 flex gap-3 sm:gap-4 transition-all relative ${
                  !notif.is_read ? 'bg-emerald-50/20 -mx-3 px-3 sm:-mx-4 sm:px-4 rounded-2xl' : ''
                }`}
              >
                {/* Left Minimalist Dot & Icon Indicator */}
                <div className="flex flex-col items-center flex-shrink-0 mt-1 relative">
                  {!notif.is_read && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                  <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shadow-3xs transition-transform group-hover:scale-105 ${getNotifIconBg(notif.type)}`}>
                    {getNotifIcon(notif.type)}
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                      {notif.title}
                    </h3>
                    <span className="text-[9.5px] text-slate-400 font-normal whitespace-nowrap pt-0.5">
                      {notif.time_ago}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed break-words">
                    {notif.message}
                  </p>

                  {/* Actions Inline Footer Row - Premium Minimalist Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    {notif.link && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!notif.is_read) markReadMutation.mutate(notif.id);
                          navigate(notif.link!);
                        }}
                        className="text-[10.5px] font-bold text-[#04593f] hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <span>Lihat Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Hapus notifikasi ini?')) {
                          deleteNotifMutation.mutate(notif.id);
                        }
                      }}
                      disabled={deleteNotifMutation.isPending}
                      className="text-[10.5px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
