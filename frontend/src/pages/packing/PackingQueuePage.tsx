import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderItem } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderPackagesModal } from '../../components/orders/OrderPackagesModal';
import { Eye, Package, Calendar, Truck, CheckCircle2, Bell, Clock } from 'lucide-react';

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: Order) => {
            // Calculate total items and allocated items across packages
            const totalRequiredQty = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
            
            // Map allocated quantity per order_item_id across all packages
            const allocatedQtyMap: Record<number, number> = {};
            if (order.packages) {
              order.packages.forEach((pkg) => {
                pkg.items?.forEach((pi) => {
                  allocatedQtyMap[pi.order_item_id] = (allocatedQtyMap[pi.order_item_id] || 0) + pi.quantity;
                });
              });
            }

            const totalAllocatedQty = Object.values(allocatedQtyMap).reduce((a, b) => a + b, 0);
            const isPartial = totalAllocatedQty > 0 && totalAllocatedQty < totalRequiredQty;
            const unallocatedCount = totalRequiredQty - totalAllocatedQty;

            // Unallocated item names for top banner
            const unallocatedItemNames = order.items
              ?.filter((item) => item.id && ((item.quantity || 0) - (allocatedQtyMap[item.id] || 0)) > 0)
              .map((item) => item.tree_name || item.product_name) || [];

            return (
              <div key={order.id} className="space-y-2 font-sans">
                {/* Top Yellow Warning Notification Banner if unallocated items exist */}
                {isPartial && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-amber-900 leading-tight">
                      <span className="font-extrabold">{unallocatedCount} item ({unallocatedItemNames.join(', ')})</span> pada pesanan ini <span className="font-bold">belum diatur paket</span>
                    </p>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-[#04593f] transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header Card: Order Number & Status Badge */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">{order.order_number}</span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </div>

                      {/* Status Badge: "Sebagian Dikirim" if partial, otherwise OrderStatusBadge */}
                      {isPartial ? (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold">
                          Sebagian Dikirim
                        </span>
                      ) : (
                        <OrderStatusBadge status={order.status} />
                      )}
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

                    {/* Items Summary Rangkaian */}
                    <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl text-[11px] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        RINCIAN BARANG RANGKAIAN ({order.items?.length || 0} ITEM):
                      </span>
                      <div className="space-y-1">
                        {order.items?.map((item: OrderItem, i: number) => (
                          <div key={i} className="flex justify-between font-bold text-slate-800 text-xs">
                            <span className="truncate pr-2">• {item.tree_name || item.product_name} (Grade {item.grade || 'A'})</span>
                            <span className="shrink-0 text-slate-600 font-semibold">— {item.quantity} Qty</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Item Status Cards: Belum Dikemas vs Dikemas (Matching Mockup) */}
                    <div className="space-y-2">
                      {order.items?.map((item: OrderItem) => {
                        const itemId = item.id;
                        const allocated = itemId ? (allocatedQtyMap[itemId] || 0) : 0;
                        const isAllocated = allocated >= (item.quantity || 1);

                        return (
                          <div
                            key={item.id || item.product_name}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isAllocated
                                ? 'bg-emerald-50/50 border-emerald-200/80'
                                : 'bg-amber-50/40 border-amber-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                                  isAllocated
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-100 text-amber-600 border-amber-300'
                                }`}
                              >
                                {isAllocated ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  {item.tree_name || item.product_name} (Grade {item.grade || 'A'})
                                </p>
                                <div className="mt-1">
                                  {isAllocated ? (
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      Dikemas: {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 border border-amber-200 text-[9px] font-bold">
                                      Belum Dikemas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-700 shrink-0">— {item.quantity} Qty</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notes if available */}
                    {order.notes && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs space-y-1">
                        <span className="font-extrabold text-amber-950 uppercase block text-[9.5px]">CATATAN TANAMAN / PACKING:</span>
                        <p className="text-amber-900 font-medium italic">"{order.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Buttons Side-by-Side: Lihat Detail & Atur Paket */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailOrder(order)}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>Lihat Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPackageOrder(order)}
                      className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-950 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Atur Paket</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
