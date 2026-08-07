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
        return <ShoppingBag className="w-5 h-5 text-amber-700" />;
      case 'ORDER_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-700" />;
      case 'PACKING_COMPLETED':
        return <Package className="w-5 h-5 text-blue-700" />;
      case 'SHIPMENT_COMPLETED':
        return <Send className="w-5 h-5 text-purple-700" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-800" />;
    }
  };

  const getNotifBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'ORDER_CREATED':
        return 'bg-amber-50 border-amber-200';
      case 'ORDER_APPROVED':
        return 'bg-emerald-50 border-emerald-200';
      case 'PACKING_COMPLETED':
        return 'bg-blue-50 border-blue-200';
      case 'SHIPMENT_COMPLETED':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
              <span>Notifikasi Sistem</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-xs font-black">
                  {unreadCount} Baru
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pantau notifikasi dan aktivitas alur kerja pesanan secara real-time
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-4 py-2.5 bg-white border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-900 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-emerald-800" />
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semua ({allNotifications.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500 bg-white rounded-3xl border-2 border-slate-200">
            Memuat notifikasi...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl border-2 border-emerald-200 flex items-center justify-center text-emerald-800">
              <Sparkles className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Tidak ada notifikasi</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs mx-auto">
                {filter === 'unread' ? 'Semua notifikasi telah Anda baca.' : 'Belum ada notifikasi baru untuk aktivitas pesanan.'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 rounded-3xl border-2 transition-all space-y-3 shadow-xs relative ${
                !notif.is_read ? 'bg-emerald-50/40 border-emerald-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-xs ${getNotifBg(
                      notif.type
                    )}`}
                  >
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">{notif.title}</h3>
                      {!notif.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold pt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{notif.time_ago}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Link */}
                {notif.link && (
                  <button
                    onClick={() => {
                      if (!notif.is_read) markReadMutation.mutate(notif.id);
                      navigate(notif.link!);
                    }}
                    className="px-3.5 py-2 bg-white border-2 border-slate-200 hover:border-emerald-700 hover:bg-emerald-50 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-1 shadow-xs transition-all flex-shrink-0 cursor-pointer"
                  >
                    <span>Buka</span>
                    <ChevronRight className="w-4 h-4 text-emerald-800" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
