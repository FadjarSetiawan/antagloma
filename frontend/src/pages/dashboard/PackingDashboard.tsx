import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { Clock, Truck, FileText, Send, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PackingQueuePage } from '../packing/PackingQueuePage';

export const PackingDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = dashboardData?.data || [];

  const waitingVerification = orders.filter((o: Order) => o.status === 'WAITING_PROCESS').length;
  const pendingShipping = orders.filter((o: Order) => o.status === 'WAITING_PACKING').length;
  const pendingInvoice = orders.filter((o: Order) => o.status === 'PACKING_COMPLETED' && !o.tracking_number).length;
  const waitingTrackingNumber = orders.filter((o: Order) => o.status === 'PACKING_COMPLETED' || (o.status === 'COMPLETED' && !o.tracking_number)).length;

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
      title: 'Menunggu Cetak Dokumen',
      value: isLoading ? '...' : pendingInvoice,
      caption: pendingInvoice > 0 ? `${pendingInvoice} order perlu dicetak` : 'Semua dokumen dicetak',
      buttonText: 'Cetak Dokumen',
      icon: FileText,
      link: '/documents/print',
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
    <div className="space-y-6 max-w-7xl pb-24 font-sans">
      {/* Header Banner */}
      <div className="pt-1">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Dashboard Staff Packing</h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">Pantau dan atur pengemasan paket order real-time.</p>
      </div>

      {/* Synchronized 4 Stat Cards */}
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

      {/* Main Packing Queue Content */}
      <div className="pt-2">
        <PackingQueuePage />
      </div>
    </div>
  );
};
