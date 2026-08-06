import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderItem } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { UploadPackingProofModal } from '../../components/orders/UploadPackingProofModal';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { Upload, Eye, Printer, Package, Phone, Calendar, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-5 max-w-7xl pb-12">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Antrean Packing Tanaman</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Daftar pesanan Adenium yang disetujui admin, siap dikemas, dan diunggah foto buktinya.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-bold bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
          Memuat antrean packing...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center text-emerald-800">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Tidak ada antrean packing</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs mx-auto">
              Semua pesanan saat ini sudah dikemas atau belum disetujui oleh Admin/Owner.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: Order) => (
            <div
              key={order.id}
              className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block">{order.order_number}</span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" /> Tgl Order:{' '}
                      {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center justify-between">
                    <span>Customer:</span>
                    <span className="text-slate-700 font-normal">{order.customer_name} ({order.phone})</span>
                  </div>
                  <div className="font-extrabold text-slate-900 flex items-center justify-between">
                    <span>Metode Pengiriman:</span>
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> {order.delivery_method}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    RINCIAN BARANG RANGKAIAN:
                  </span>
                  {order.items && order.items.length > 0 ? (
                    <ul className="list-disc list-inside font-bold text-slate-800 space-y-0.5">
                      {order.items.map((item: OrderItem, i: number) => (
                        <li key={i} className="truncate">
                          {item.tree_name || item.product_name} (Grade {item.grade || 'A'}) — {item.quantity} Qty
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 font-medium">Tidak ada rincian barang</span>
                  )}
                </div>

                {/* Special Notes Callout */}
                {order.notes && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl text-[10px]">
                    <span className="font-extrabold text-amber-950 uppercase block">
                      Catatan Tanaman / Packing:
                    </span>
                    <p className="text-amber-900 font-bold italic mt-0.5">"{order.notes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer Grid */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  onClick={() => setSelectedProofOrder(order)}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-98"
                >
                  <Upload className="w-4 h-4" /> Upload Foto Packing
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedDetailOrder(order)}
                    className="py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-800" /> Detail
                  </button>

                  <button
                    onClick={() => setSelectedNotaOrder(order)}
                    className="py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-700" /> Nota
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadPackingProofModal
        order={selectedProofOrder}
        onClose={() => setSelectedProofOrder(null)}
        onUpload={(orderId, file, notes) => uploadProofMutation.mutateAsync({ orderId, file, notes })}
      />

      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      <PackingNotaModal
        order={selectedNotaOrder}
        onClose={() => setSelectedNotaOrder(null)}
      />
    </div>
  );
};
