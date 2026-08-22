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

  const getNotifMeta = (type: AppNotification['type']) => {
    switch (type) {
      case 'ORDER_CREATED':
        return {
          icon: ShoppingBag,
          badgeLabel: 'Pesanan Baru',
          iconColor: 'text-amber-700',
          bgColor: 'bg-amber-100/80 border-amber-200',
          badgeStyle: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'ORDER_APPROVED':
        return {
          icon: CheckCircle2,
          badgeLabel: 'Pembayaran Diverifikasi',
          iconColor: 'text-emerald-700',
          bgColor: 'bg-emerald-100/80 border-emerald-200',
          badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        };
      case 'PACKING_COMPLETED':
        return {
          icon: Package,
          badgeLabel: 'Packing Selesai',
          iconColor: 'text-blue-700',
          bgColor: 'bg-blue-100/80 border-blue-200',
          badgeStyle: 'bg-blue-100 text-blue-900 border-blue-200',
        };
      case 'SHIPMENT_COMPLETED':
        return {
          icon: Send,
          badgeLabel: 'Resi Terkirim',
          iconColor: 'text-emerald-800',
          bgColor: 'bg-emerald-100/90 border-emerald-300',
          badgeStyle: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        };
      default:
        return {
          icon: Bell,
          badgeLabel: 'Info Toko',
          iconColor: 'text-slate-700',
          bgColor: 'bg-slate-100 border-slate-200',
          badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-28 font-sans text-slate-900 px-3 sm:px-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-1 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            aria-label="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Notifikasi Aktivitas
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-xs font-heading font-extrabold shadow-2xs">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Pantau jalannya proses transaksi dan aktivitas toko real-time
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#04593f] border border-emerald-200 hover:border-emerald-300 rounded-2xl text-xs sm:text-sm font-heading font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-[#04593f]" />
            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 bg-slate-100/90 p-1.5 rounded-2xl gap-2 font-heading font-bold text-xs sm:text-sm border border-slate-200/80">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-[#04593f] shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Semua ({allNotifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-white text-[#04593f] shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Belum Dibaca ({unreadCount})</span>
        </button>
      </div>

      {/* Notifications Streamlined List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            Memuat aktivitas notifikasi...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#04593f]">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Tidak ada notifikasi baru
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'Semua notifikasi aktivitas telah dibaca.'
                  : 'Belum ada notifikasi aktivitas transaksi.'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const meta = getNotifMeta(notif.type);
            const IconComponent = meta.icon;

            return (
              <article
                key={notif.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all relative space-y-3 shadow-2xs ${
                  !notif.is_read
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200/60'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Header Row: Icon + Title + Timestamp */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-3xs ${meta.bgColor}`}
                    >
                      <IconComponent className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>
                    {!notif.is_read && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border-2 border-white"></span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-xs font-heading font-bold ${meta.badgeStyle}`}
                      >
                        {meta.badgeLabel}
                      </span>
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {notif.time_ago}
                      </span>
                    </div>

                    <h2 className="font-heading text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                      {notif.title}
                    </h2>
                  </div>
                </div>

                {/* Body Content */}
                <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed pl-1">
                  {notif.message}
                </p>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  {notif.link ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!notif.is_read) markReadMutation.mutate(notif.id);
                        navigate(notif.link!);
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-heading font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Lihat Detail</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Hapus notifikasi ini?')) {
                        deleteNotifMutation.mutate(notif.id);
                      }
                    }}
                    disabled={deleteNotifMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                    title="Hapus notifikasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

