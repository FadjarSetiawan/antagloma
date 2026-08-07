import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderItem } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { UploadPackingProofModal } from '../../components/orders/UploadPackingProofModal';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { Upload, Eye, Printer, Package, Calendar, Truck, CheckCircle2 } from 'lucide-react';

export const PackingQueuePage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedNotaOrder, setSelectedNotaOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['packing-queue'],
    queryFn: () => orderService.getPackingQueue(),
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ orderId, file, notes }: { orderId: number; file: File; notes?: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (notes) formData.append('notes', notes);
      return orderService.uploadPackingProof(orderId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing-queue'] });
      setSelectedProofOrder(null);
    },
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-4 max-w-7xl pb-24">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Antrean Packing Tanaman</h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Daftar pesanan Adenium yang disetujui, siap dikemas, dan diunggah foto buktinya.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-normal bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          Memuat antrean packing...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
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
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">{order.order_number}</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs font-normal">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold text-slate-900">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pengiriman:</span>
                    <span className="text-[#04593f] font-bold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> {order.delivery_method}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Daftar Tanaman ({order.items?.length || 0} Varian):
                  </span>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {order.items?.map((item: OrderItem, i: number) => (
                      <div key={i} className="flex justify-between font-bold text-slate-800">
                        <span className="truncate pr-2">• {item.tree_name || item.product_name}</span>
                        <span className="flex-shrink-0 text-slate-600">{item.quantity}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedDetailOrder(order)}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Lihat Detail"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSelectedNotaOrder(order)}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Cetak Nota"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                </button>

                {order.status === 'WAITING_PACKING' ? (
                  <button
                    onClick={() => setSelectedProofOrder(order)}
                    className="flex-1 py-2 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Packing</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 bg-emerald-50 text-[#04593f] rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sudah Dikemas</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Packing Proof Modal */}
      <UploadPackingProofModal
        order={selectedProofOrder}
        onClose={() => setSelectedProofOrder(null)}
        onUpload={async (orderId: number, file: File, notes?: string) => {
          await uploadProofMutation.mutateAsync({ orderId, file, notes });
        }}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      {/* Packing Nota Thermal Modal */}
      <PackingNotaModal
        order={selectedNotaOrder}
        onClose={() => setSelectedNotaOrder(null)}
      />
    </div>
  );
};
