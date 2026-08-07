import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { Clock, Truck, FileText, Send, ChevronRight, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders = dashboardData?.data || [];

  const waitingVerification = orders.filter((o) => o.status === 'WAITING_PROCESS').length;
  const pendingShipping = orders.filter((o) => o.status === 'WAITING_PACKING').length;
  const pendingInvoice = orders.filter((o) => o.status === 'PACKING_COMPLETED' && !o.tracking_number).length;
  const waitingTrackingNumber = orders.filter((o) => o.status === 'PACKING_COMPLETED' || (o.status === 'COMPLETED' && !o.tracking_number)).length;

  const statCards = [
    {
      title: 'Menunggu Verifikasi Pembayaran',
      value: isLoading ? '...' : waitingVerification,
      caption: waitingVerification > 0 ? `${waitingVerification} order perlu verifikasi` : 'Semua pembayaran terverifikasi',
      icon: Clock,
      link: '/orders/verification',
    },
    {
      title: 'Belum Diatur Pengiriman',
      value: isLoading ? '...' : pendingShipping,
      caption: pendingShipping > 0 ? `${pendingShipping} order siap kemas` : 'Semua pengiriman teratur',
      icon: Truck,
      link: '/packing',
    },
    {
      title: 'Belum Dibuatkan Nota',
      value: isLoading ? '...' : pendingInvoice,
      caption: pendingInvoice > 0 ? `${pendingInvoice} order perlu cetak nota` : 'Semua nota dibuatkan',
      icon: FileText,
      link: '/orders?status=PACKING_COMPLETED',
    },
    {
      title: 'Menunggu Input Resi',
      value: isLoading ? '...' : waitingTrackingNumber,
      caption: waitingTrackingNumber > 0 ? `${waitingTrackingNumber} order perlu nomor resi` : 'Semua resi terinput',
      icon: Send,
      link: '/orders?status=PACKING_COMPLETED',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Kelola dan pantau pesanan pelanggan dengan mudah.</p>
        </div>
        <button
          onClick={() => navigate('/orders/create')}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> + Buat Pesanan
        </button>
      </div>

      {/* 2x2 Grid Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="bg-white border-2 border-slate-200 rounded-3xl p-4 md:p-5 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition-all cursor-pointer relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  {card.title}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900">{card.value}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">{card.caption}</p>
              </div>

              <div className="flex justify-end pt-1">
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-emerald-800 group-hover:text-white text-slate-600 border border-slate-200 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ringkasan Penjualan Banner */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Ringkasan Penjualan</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pantau performa penjualan tokomu dari laporan harian hingga bulanan.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>Lihat Laporan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Transaksi Pesanan Terbaru</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-bold text-slate-500">Memuat data transaksi...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-500">Belum ada aktivitas transaksi terbaru.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block">{order.order_number}</span>
                  <span className="text-slate-500 font-medium">{order.customer_name} — {order.delivery_method}</span>
                </div>
                <div className="flex items-center gap-3">
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
