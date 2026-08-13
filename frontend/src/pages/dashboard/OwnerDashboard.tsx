import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { ShoppingBag, Clock, Users, BarChart3, ChevronRight, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = dashboardData?.data || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o: Order) => o.order_date === todayStr).length;
  const waitingVerification = orders.filter((o: Order) => o.status === 'WAITING_PROCESS').length;
  const completedOrders = orders.filter((o: Order) => o.status === 'COMPLETED' || o.status === 'PACKING_COMPLETED').length;

  const statCards = [
    {
      title: 'Pesanan Masuk Hari Ini',
      value: isLoading ? '...' : todayOrders,
      caption: todayOrders > 0 ? `${todayOrders} pesanan hari ini` : 'Belum ada pesanan',
      hasNotification: todayOrders > 0,
      buttonText: 'Lihat Order',
      icon: ShoppingBag,
      link: `/orders?order_date=${todayStr}`,
    },
    {
      title: 'Menunggu Verifikasi Pembayaran',
      value: isLoading ? '...' : waitingVerification,
      caption: waitingVerification > 0 ? `${waitingVerification} order perlu verifikasi` : 'Semua terverifikasi',
      hasNotification: waitingVerification > 0,
      buttonText: 'Verifikasi',
      icon: Clock,
      link: '/orders/verification',
    },
    {
      title: 'Manajemen Akun User Staff',
      value: 'Staff',
      caption: 'Kelola akses akun admin & sales',
      hasNotification: false,
      buttonText: 'Kelola User',
      icon: Users,
      link: '/users',
    },
    {
      title: 'Laporan Penjualan & Omset',
      value: isLoading ? '...' : completedOrders,
      caption: completedOrders > 0 ? `${completedOrders} order selesai` : 'Analisis omset toko',
      hasNotification: false,
      buttonText: 'Lihat Laporan',
      icon: BarChart3,
      link: '/reports',
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl pb-24 font-sans text-slate-900">
      {/* Header Banner - Streamlined & Clean */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Dashboard Owner</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Ringkasan performa dan transaksi Antagloma Florist secara real-time.</p>
        </div>

        {/* Desktop-only action button */}
        <button
          onClick={() => navigate('/orders/create')}
          className="hidden sm:flex px-4 py-2 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Buat Order
        </button>
      </div>

      {/* Sleek Compact 2x2 Grid Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs hover:border-[#04593f] hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#04593f]" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{card.value}</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight block">
                  {card.title}
                </h3>
                
                <div className="mt-1 flex items-center">
                  {card.hasNotification ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/90 text-[10px] font-bold shadow-2xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                      <span>{card.caption}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal leading-none">{card.caption}</span>
                  )}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  className="w-full py-1.5 px-2 bg-emerald-50 group-hover:bg-[#04593f] text-[#04593f] group-hover:text-white rounded-xl text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{card.buttonText}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sleek Sales Report Banner */}
      <div
        onClick={() => navigate('/reports')}
        className="bg-gradient-to-br from-[#04593f] via-[#04593f] to-emerald-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-lg relative overflow-hidden border border-emerald-950 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group font-sans"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center flex-shrink-0 shadow-inner">
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white">Ringkasan Penjualan</h2>
            <p className="text-[10px] sm:text-xs text-emerald-200/90 font-medium mt-0.5">
              Pantau laporan omset harian hingga bulanan toko.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="px-3 py-1.5 bg-white/15 group-hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors relative z-10 shrink-0"
        >
          <span>Laporan</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Transaksi Pesanan Terbaru</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] font-semibold text-[#04593f] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs font-normal text-slate-400">Memuat data...</div>
        ) : orders.length === 0 ? (
          <div className="py-6 text-center text-xs font-normal text-slate-400">Belum ada aktivitas transaksi terbaru.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order: Order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{order.order_number}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{order.customer_name} • {order.delivery_method}</span>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
