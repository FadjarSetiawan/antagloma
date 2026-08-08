import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { CompleteShipmentModal } from '../../components/orders/CompleteShipmentModal';
import { Clock, Truck, FileText, Camera, ChevronRight, TrendingUp, Plus, ArrowRight, PackageCheck, Eye, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedShipmentOrder, setSelectedShipmentOrder] = useState<Order | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = dashboardData?.data || [];

  const waitingVerification = orders.filter((o: Order) => o.status === 'WAITING_PROCESS').length;
  const pendingShipping = orders.filter((o: Order) => o.status === 'WAITING_PACKING').length;
  const pendingInvoice = orders.filter((o: Order) => o.status === 'WAITING_PACKING' && (!o.packing_images || o.packing_images.length === 0)).length;

  // Card 4: Menunggu Foto Paket (orders in WAITING_PACKING waiting for packing proof upload)
  const pendingPhotoUpload = orders.filter((o: Order) => o.status === 'WAITING_PACKING' && (!o.packing_images || o.packing_images.length === 0)).length;

  // Table at bottom: Orders that have photo uploaded (PACKING_COMPLETED) waiting for resi input
  const waitingResiOrders = orders.filter((o: Order) => o.status === 'PACKING_COMPLETED' && (!o.tracking_number || o.tracking_number.trim() === ''));

  const shipmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { shipping_cost?: number; tracking_number?: string } }) =>
      orderService.completeShipment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setSelectedShipmentOrder(null);
    },
  });

  const handleConfirmShipment = async (orderId: number, payload: { shipping_cost: number; tracking_number: string }) => {
    await shipmentMutation.mutateAsync({ id: orderId, payload });
  };

  const statCards = [
    {
      title: 'Menunggu Verifikasi Pembayaran',
      value: isLoading ? '...' : waitingVerification,
      caption: waitingVerification > 0 ? `${waitingVerification} order perlu verifikasi` : 'Semua terverifikasi',
      hasNotification: waitingVerification > 0,
      buttonText: 'Lakukan Verifikasi',
      icon: Clock,
      link: '/orders/verification',
    },
    {
      title: 'Belum Diatur Pengiriman',
      value: isLoading ? '...' : pendingShipping,
      caption: pendingShipping > 0 ? `${pendingShipping} order siap kemas` : 'Semua teratur',
      hasNotification: pendingShipping > 0,
      buttonText: 'Atur Pengiriman',
      icon: Truck,
      link: '/packing',
    },
    {
      title: 'Dokumen Pengiriman',
      value: isLoading ? '...' : pendingInvoice,
      caption: pendingInvoice > 0 ? `${pendingInvoice} Dokumen baru menunggu dicetak` : 'Semua dokumen dicetak',
      hasNotification: pendingInvoice > 0,
      buttonText: 'Cetak Dokumen',
      icon: FileText,
      link: '/documents/print',
    },
    {
      title: 'Menunggu Foto Paket',
      value: isLoading ? '...' : pendingPhotoUpload,
      caption: pendingPhotoUpload > 0 ? `${pendingPhotoUpload} paket perlu difoto` : 'Semua paket difoto',
      hasNotification: pendingPhotoUpload > 0,
      buttonText: 'Input Foto Paket',
      icon: Camera,
      link: '/packing',
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl pb-24 font-sans text-slate-900">
      {/* Header Banner - Streamlined & Clean */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Pantau dan kelola operasional toko secara real-time.</p>
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

      {/* Dedicated Section: Tabel Daftar Pesanan Menunggu Input Resi */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#04593f]" />
              <span>Daftar Pesanan Menunggu Input Resi</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Pesanan yang sudah diunggah foto bukti packing-nya dan siap diinputkan nomor resinya
            </p>
          </div>

          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold">
            {waitingResiOrders.length} Order Menunggu Resi
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-normal text-slate-400">
            Memuat daftar pesanan menunggu resi...
          </div>
        ) : waitingResiOrders.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700">Tidak Ada Pesanan Menunggu Resi</p>
            <p className="text-[11px] text-slate-400">Pesanan yang telah diunggah foto packing-nya akan muncul di sini untuk diinputkan resi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">No. Order & Tgl</th>
                  <th className="py-2.5 px-3">Customer / Pemesan</th>
                  <th className="py-2.5 px-3">Metode Pengiriman</th>
                  <th className="py-2.5 px-3 text-center">Foto Packing</th>
                  <th className="py-2.5 px-3 text-center">Status Resi</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {waitingResiOrders.map((order: Order) => (
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
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded">
                        ✓ Foto Ada ({order.packing_images?.length || 1})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold rounded">
                        Belum Input Resi
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedShipmentOrder(order)}
                          className="px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Input Resi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      {/* Complete Shipment (Input Resi) Modal */}
      <CompleteShipmentModal
        order={selectedShipmentOrder}
        onClose={() => setSelectedShipmentOrder(null)}
        onConfirm={handleConfirmShipment}
      />
    </div>
  );
};
