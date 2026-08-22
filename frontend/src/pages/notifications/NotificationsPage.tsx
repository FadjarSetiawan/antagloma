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
          bgColor: 'bg-amber-50 border-amber-200/80',
          badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
        };
      case 'ORDER_APPROVED':
        return {
          icon: CheckCircle2,
          badgeLabel: 'Pembayaran Diverifikasi',
          iconColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50 border-emerald-200/80',
          badgeStyle: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        };
      case 'PACKING_COMPLETED':
        return {
          icon: Package,
          badgeLabel: 'Packing Selesai',
          iconColor: 'text-sky-700',
          bgColor: 'bg-sky-50 border-sky-200/80',
          badgeStyle: 'bg-sky-50 text-sky-900 border-sky-200',
        };
      case 'SHIPMENT_COMPLETED':
        return {
          icon: Send,
          badgeLabel: 'Resi Terkirim',
          iconColor: 'text-emerald-800',
          bgColor: 'bg-emerald-50 border-emerald-200/80',
          badgeStyle: 'bg-emerald-50 text-emerald-950 border-emerald-200',
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
    <div className="max-w-3xl mx-auto pb-28 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="px-4 sm:px-0 pt-2 pb-4 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            aria-label="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                Notifikasi Aktivitas
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-xs font-heading font-bold shadow-2xs">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pantau jalannya proses transaksi dan aktivitas toko real-time
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-200 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-[#04593f]" />
            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-0 py-3 flex items-center gap-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#04593f] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Semua ({allNotifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-[#04593f] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Belum Dibaca ({unreadCount})</span>
        </button>
      </div>

      {/* Notifications List - Cardless with Responsive Divider */}
      <div>
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            Memuat aktivitas notifikasi...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#04593f]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Tidak ada notifikasi
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'Semua notifikasi aktivitas telah dibaca.'
                  : 'Belum ada notifikasi aktivitas transaksi.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80">
            {filteredNotifications.map((notif) => {
              const meta = getNotifMeta(notif.type);
              const IconComponent = meta.icon;

              return (
                <article
                  key={notif.id}
                  className={`py-4 px-4 sm:px-2 transition-colors hover:bg-slate-50/60 ${
                    !notif.is_read ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon Badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${meta.bgColor}`}
                      >
                        <IconComponent className={`w-5 h-5 ${meta.iconColor}`} />
                      </div>
                      {!notif.is_read && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                        </span>
                      )}
                    </div>

                    {/* Main Notification Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Meta Category & Timestamp */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-heading font-bold ${meta.badgeStyle}`}
                        >
                          {meta.badgeLabel}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {notif.time_ago}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="font-heading text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {notif.title}
                      </h2>

                      {/* Message Body */}
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Links/Buttons */}
                      <div className="pt-1.5 flex items-center justify-between gap-3">
                        {notif.link ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!notif.is_read) markReadMutation.mutate(notif.id);
                              navigate(notif.link!);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#04593f] hover:bg-emerald-950 text-white rounded-lg text-xs font-heading font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <span>Lihat Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus notifikasi ini?')) {
                              deleteNotifMutation.mutate(notif.id);
                            }
                          }}
                          disabled={deleteNotifMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus notifikasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
