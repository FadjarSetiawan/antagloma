import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { ShoppingBag, Clock, Package, CheckCircle2, ChevronRight, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = dashboardData?.data || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o: Order) => o.order_date === todayStr).length;
  const waitingProcess = orders.filter((o: Order) => o.status === 'WAITING_PROCESS').length;
  const waitingPacking = orders.filter((o: Order) => o.status === 'WAITING_PACKING').length;
  const completedOrders = orders.filter((o: Order) => o.status === 'COMPLETED' || o.status === 'PACKING_COMPLETED').length;

  const statCards = [
    {
      title: 'Pesanan Hari Ini',
      value: isLoading ? '...' : todayOrders,
      caption: todayOrders > 0 ? `${todayOrders} pesanan baru` : 'Belum ada order',
      hasNotification: todayOrders > 0,
      buttonText: 'Lihat Order',
      icon: ShoppingBag,
      link: '/orders',
    },
    {
      title: 'Menunggu Diproses',
      value: isLoading ? '...' : waitingProcess,
      caption: waitingProcess > 0 ? `${waitingProcess} perlu verifikasi` : 'Menunggu admin',
      hasNotification: waitingProcess > 0,
      buttonText: 'Cek Status',
      icon: Clock,
      link: '/orders?status=WAITING_PROCESS',
    },
    {
      title: 'Menunggu Packing',
      value: isLoading ? '...' : waitingPacking,
      caption: waitingPacking > 0 ? `${waitingPacking} siap dikemas` : 'Dalam pengemasan',
      hasNotification: waitingPacking > 0,
      buttonText: 'Cek Antrean',
      icon: Package,
      link: '/packing',
    },
    {
      title: 'Pesanan Selesai',
      value: isLoading ? '...' : completedOrders,
      caption: completedOrders > 0 ? `${completedOrders} order selesai` : 'Resi terkirim',
      hasNotification: false,
      buttonText: 'Lihat Selesai',
      icon: CheckCircle2,
      link: '/orders?status=COMPLETED',
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl pb-24 font-sans text-slate-900">
      {/* Header Banner - Streamlined & Clean */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Sales Dashboard</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Kelola dan pantau transaksi penjualan tokomu.</p>
        </div>

        {/* Desktop-only action button */}
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
    </div>
  );
};
