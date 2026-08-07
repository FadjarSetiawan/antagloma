import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { Package, Printer, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PackingQueuePage } from '../packing/PackingQueuePage';

export const PackingDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = dashboardData?.data || [];

  const pendingShipping = orders.filter((o: Order) => o.status === 'WAITING_PACKING').length;
  const pendingInvoice = orders.filter((o: Order) => o.status === 'PACKING_COMPLETED' && !o.tracking_number).length;
  const completedPacking = orders.filter((o: Order) => o.status === 'PACKING_COMPLETED' || o.status === 'COMPLETED').length;

  const statCards = [
    {
      title: 'Belum Diatur Pengiriman',
      value: isLoading ? '...' : pendingShipping,
      caption: pendingShipping > 0 ? `${pendingShipping} order perlu diatur` : 'Semua paket teratur',
      hasNotification: pendingShipping > 0,
      buttonText: 'Atur Pengiriman',
      icon: Package,
      link: '/packing',
    },
    {
      title: 'Dokumen Pengiriman',
      value: isLoading ? '...' : pendingInvoice,
      caption: pendingInvoice > 0 ? `${pendingInvoice} Dokumen baru menunggu dicetak` : 'Semua dokumen dicetak',
      hasNotification: pendingInvoice > 0,
      buttonText: 'Cetak Dokumen',
      icon: Printer,
      link: '/documents/print',
    },
    {
      title: 'Pesanan Selesai Dikemas',
      value: isLoading ? '...' : completedPacking,
      caption: completedPacking > 0 ? `${completedPacking} order selesai kemas` : 'Siap dikirim',
      hasNotification: false,
      buttonText: 'Lihat Selesai',
      icon: CheckCircle2,
      link: '/orders?status=COMPLETED',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-24 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="pt-1">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Dashboard Staff Packing</h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">Pantau dan atur pengemasan paket order real-time.</p>
      </div>

      {/* Tailored 3 Stat Cards for Packing Role */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#04593f] hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#04593f]" />
                </div>
                <span className="text-2xl font-black text-slate-900">{card.value}</span>
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

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  className="w-full py-1.5 px-3 bg-emerald-50 group-hover:bg-[#04593f] text-[#04593f] group-hover:text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{card.buttonText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Packing Queue Content */}
      <div className="pt-2">
        <PackingQueuePage />
      </div>
    </div>
  );
};
