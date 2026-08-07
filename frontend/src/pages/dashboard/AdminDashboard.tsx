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
      caption: waitingVerification > 0 ? `${waitingVerification} order perlu verifikasi` : 'Semua terverifikasi',
      buttonText: 'Lakukan Verifikasi',
      icon: Clock,
      link: '/orders/verification',
    },
    {
      title: 'Belum Diatur Pengiriman',
      value: isLoading ? '...' : pendingShipping,
      caption: pendingShipping > 0 ? `${pendingShipping} order siap kemas` : 'Semua teratur',
      buttonText: 'Atur Pengiriman',
      icon: Truck,
      link: '/packing',
    },
    {
      title: 'Belum Dibuatkan Nota',
      value: isLoading ? '...' : pendingInvoice,
      caption: pendingInvoice > 0 ? `${pendingInvoice} order perlu nota` : 'Semua nota dibuat',
      buttonText: 'Buat Nota',
      icon: FileText,
      link: '/orders?status=PACKING_COMPLETED',
    },
    {
      title: 'Menunggu Input Resi',
      value: isLoading ? '...' : waitingTrackingNumber,
      caption: waitingTrackingNumber > 0 ? `${waitingTrackingNumber} order perlu resi` : 'Semua resi terinput',
      buttonText: 'Input Resi',
      icon: Send,
      link: '/orders?status=PACKING_COMPLETED',
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl pb-24">
      {/* Header Banner - Streamlined & Clean */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Pantau dan kelola operasional toko secara real-time.</p>
        </div>

        {/* Desktop-only action button (Mobile uses center floating bottom nav button) */}
        <button
          onClick={() => navigate('/orders/create')}
          className="hidden sm:flex px-4 py-2 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> + Buat Order
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
                <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-none">{card.caption}</p>
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
        className="bg-[#04593f] text-white rounded-2xl p-4 flex items-center justify-between shadow-xs cursor-pointer hover:bg-emerald-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Ringkasan Penjualan</h3>
            <p className="text-[11px] text-emerald-100/80 font-normal mt-0.5">
              Pantau laporan omset harian hingga bulanan toko.
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white flex items-center gap-1 flex-shrink-0">
          <span>Laporan</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
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
            {orders.slice(0, 5).map((order) => (
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
