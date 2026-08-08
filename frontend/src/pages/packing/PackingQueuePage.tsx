import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderItem } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderPackagesModal } from '../../components/orders/OrderPackagesModal';
import { Eye, Package, Calendar, Truck, CheckCircle2 } from 'lucide-react';

export const PackingQueuePage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedPackageOrder, setSelectedPackageOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['packing-queue'],
    queryFn: () => orderService.getPackingQueue(),
  });

  const handleSavePackages = async (orderId: number, packages: any[]) => {
    await orderService.configurePackages(orderId, packages.map(({ id, letter, subOrderNumber, packageType, allocations, customWeight }) => ({
      letter, package_type: packageType, allocations, weight: customWeight, sub_order_number: subOrderNumber,
    })));

    queryClient.invalidateQueries({ queryKey: ['packing-queue'] });
    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
  };

  const orders = data?.data || [];

  return (
    <div className="space-y-4 max-w-7xl pb-24 font-sans">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Antrean Packing Tanaman</h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Daftar pesanan Adenium yang disetujui admin, siap dikemas, dan diatur paket pengirimannya.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-normal bg-white rounded-2xl border border-slate-200 shadow-2xs">
          Memuat antrean packing...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#04593f]">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Antrean Packing</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xs mx-auto">
              Semua pesanan saat ini sudah dikemas atau belum disetujui oleh Admin/Owner.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {orders.map((order: Order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-[#04593f] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header Card: Order Number & Status Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">{order.order_number}</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  {/* Status Badge displays "Belum Diatur" */}
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs font-normal">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold text-slate-900">{order.customer_name} ({order.phone})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Metode Pengiriman:</span>
                    <span className="text-[#04593f] font-bold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> {order.delivery_method}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    RINCIAN BARANG RANGKAIAN ({order.items?.length || 0} Item):
                  </span>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {order.items?.map((item: OrderItem, i: number) => (
                      <div key={i} className="flex justify-between font-semibold text-slate-800">
                        <span className="truncate pr-2">• {item.tree_name || item.product_name} (Grade {item.grade || 'A'})</span>
                        <span className="flex-shrink-0 text-slate-600 font-bold">— {item.quantity} Qty</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes if available */}
                {order.notes && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px]">
                    <span className="font-bold text-amber-950 uppercase block text-[9px]">CATATAN TANAMAN / PACKING:</span>
                    <p className="text-amber-900 font-medium italic mt-0.5">"{order.notes}"</p>
                  </div>
                )}
              </div>

              {/* EXACT 2 BUTTONS SIDE-BY-SIDE: TOMBOL KIRI (Lihat Detail), TOMBOL KANAN (Atur Paket) */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedDetailOrder(order)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Lihat Detail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPackageOrder(order)}
                  className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Atur Paket</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      {/* Order Packages Multi-Package Modal */}
      <OrderPackagesModal
        order={selectedPackageOrder}
        onClose={() => setSelectedPackageOrder(null)}
        onSavePackages={handleSavePackages}
      />
    </div>
  );
};
