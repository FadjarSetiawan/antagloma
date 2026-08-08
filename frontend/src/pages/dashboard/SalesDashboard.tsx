import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { ShoppingBag, Clock, Package, CheckCircle2, ChevronRight, Plus, Truck, Tag, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = dashboardData?.data || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o: Order) => o.order_date === todayStr).length;

  const waitingProcessCount = orders.filter((o: Order) => o.status === 'WAITING_PROCESS').length;
  const waitingPackingCount = orders.filter((o: Order) => o.status === 'WAITING_PACKING').length;
  const packingCompletedCount = orders.filter((o: Order) => o.status === 'PACKING_COMPLETED').length;
  const shippedOrdersWithResi = orders.filter((o: Order) => Boolean(o.tracking_number) || o.status === 'COMPLETED');

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
      value: isLoading ? '...' : waitingProcessCount,
      caption: waitingProcessCount > 0 ? `${waitingProcessCount} menunggu admin` : 'Menunggu admin',
      hasNotification: waitingProcessCount > 0,
      buttonText: 'Cek Status',
      icon: Clock,
      link: '/orders?status=WAITING_PROCESS',
    },
    {
      title: 'Menunggu Packing',
      value: isLoading ? '...' : waitingPackingCount,
      caption: waitingPackingCount > 0 ? `${waitingPackingCount} siap dikemas` : 'Dalam pengemasan',
      hasNotification: waitingPackingCount > 0,
      buttonText: 'Cek Antrean',
      icon: Package,
      link: '/packing',
    },
    {
      title: 'Packing Selesai',
      value: isLoading ? '...' : packingCompletedCount,
      caption: packingCompletedCount > 0 ? `${packingCompletedCount} foto paket dikirim` : 'Belum ada foto',
      hasNotification: packingCompletedCount > 0,
      buttonText: 'Lihat Selesai',
      icon: CheckCircle2,
      link: '/orders?status=PACKING_COMPLETED',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl pb-24 font-sans text-slate-900 px-1 sm:px-0">
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
              className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between space-y-2 shadow-2xs hover:border-[#04593f] hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#04593f]" />
                </div>
                <span className="text-lg sm:text-2xl font-black text-slate-900">{card.value}</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight block truncate">
                  {card.title}
                </h3>
                
                <div className="mt-1 flex items-center max-w-full">
                  {card.hasNotification ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/90 text-[9px] sm:text-[10px] font-bold shadow-2xs max-w-full truncate">
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                      <span className="truncate">{card.caption}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal leading-none truncate">{card.caption}</span>
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

      {/* Dedicated Section: Tabel Daftar Pesanan yang Sudah Dikirimkan Nomor Resinya oleh Admin */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#04593f]" />
              <span>Daftar Pesanan Resi Terbit</span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal mt-0.5">
              Daftar pesanan dengan nomor resi terbit yang siap diinfokan ke pemesan
            </p>
          </div>

          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-50 text-[#04593f] border border-emerald-200 rounded-lg text-[10px] sm:text-xs font-bold flex-shrink-0">
            {shippedOrdersWithResi.length} Resi
          </span>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs font-normal text-slate-400">
            Memuat daftar resi pesanan...
          </div>
        ) : shippedOrdersWithResi.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700">Belum Ada Nomor Resi yang Diinput Admin</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Nomor resi yang diinput admin akan otomatis muncul di sini.</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< md screens): Responsive Cards with NO horizontal table scroll */}
            <div className="space-y-2.5 md:hidden">
              {shippedOrdersWithResi.map((order: Order) => (
                <div key={order.id} className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{order.order_number}</span>
                      <span className="text-[10px] text-slate-400">{order.order_date}</span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{order.customer_name}</span>
                      <span className="text-slate-500 font-medium text-[10px]">{order.phone} • {order.delivery_method}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-[#04593f] font-black text-[11px] rounded-lg shadow-2xs">
                      {order.tracking_number || 'Belum Input Resi'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-1.5 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailOrder(order)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Detail</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW (>= md screens): Full Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">No. Order & Tgl</th>
                    <th className="py-2.5 px-3">Customer / Pemesan</th>
                    <th className="py-2.5 px-3">Metode Pengiriman</th>
                    <th className="py-2.5 px-3">Nomor Resi</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {shippedOrdersWithResi.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{order.order_number}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{order.order_date}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{order.customer_name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{order.phone}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#04593f]" />
                          {order.delivery_method}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-[#04593f] font-black text-xs rounded-lg tracking-wide shadow-2xs">
                          {order.tracking_number || 'Belum Input Resi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />
    </div>
  );
};
