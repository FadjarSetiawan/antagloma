import React, { useState } from 'react';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../shared/OrderStatusBadge';
import { StatusTimeline } from './StatusTimeline';
import {
  X,
  User,
  Phone,
  MapPin,
  Truck,
  Printer,
  Edit3,
  Trash2,
  CheckCircle,
  PackageCheck,
  ZoomIn,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onOpenShipmentModal?: (order: Order) => void;
  onOpenNota?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (id: number) => void;
  isActionLoading?: boolean;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onApprove,
  onOpenShipmentModal,
  onOpenNota,
  onEdit,
  onDelete,
  isActionLoading = false,
}) => {
  const { user } = useAuth();
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!order) return null;

  const role = user?.role;
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isCreatorSales = role === 'sales' && order.creator?.id === user?.id;

  const formattedDate = order.order_date
    ? new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : '-';

  const plantTotalPrice = order.items
    ? order.items.reduce((sum, item) => sum + (item.quantity || 1) * (item.price || 0), 0)
    : 0;
  const shippingCost = order.buyer_shipping_cost || 0;
  const grandTotal = plantTotalPrice + shippingCost;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto w-full h-full">
        <div className="bg-white rounded-2xl border border-slate-200 w-[95%] max-w-lg md:max-w-2xl lg:max-w-3xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
          {/* Header Modal */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{order.order_number}</h3>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">Tanggal Order: {formattedDate}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Scrollable Content Body */}
          <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-900">
            {/* Status Timeline */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 tracking-wider">
                STATUS TIMELINE ORDER
              </span>
              <StatusTimeline status={order.status} />
            </div>

            {/* Customer & Shipping Info Box */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-200/80 pb-1.5 tracking-wider">
                INFORMASI PEMESAN & PENGIRIMAN
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <User className="w-3.5 h-3.5 text-[#04593f] flex-shrink-0" />
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-[#04593f] flex-shrink-0" />
                    <span>{order.phone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Truck className="w-3.5 h-3.5 text-[#04593f] flex-shrink-0" />
                    <span>{order.delivery_method}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-600 font-medium text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#04593f] flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      {[order.district_name, order.regency_name, order.province_name].filter(Boolean).join(', ')} — {order.full_address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RINCIAN PEMBAYARAN & FOTO BUKTI TRANSFER */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-200/80 pb-1.5 tracking-wider">
                RINCIAN PEMBAYARAN & BUKTI TRANSFER
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white border border-slate-200/80 rounded-lg space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">METODE PEMBAYARAN</span>
                  <span className="font-bold text-slate-900 block">{order.payment_method || 'Transfer Bank'}</span>
                  {order.bank_name && <span className="text-slate-500 font-medium text-[10px] block">Bank: {order.bank_name}</span>}
                </div>

                <div className="p-2 bg-white border border-slate-200/80 rounded-lg space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">ONGKOS KIRIM</span>
                  <span className="font-bold text-slate-900 block">
                    {shippingCost > 0 ? `Rp ${shippingCost.toLocaleString('id-ID')}` : 'Rp 0'}
                  </span>
                </div>

                <div className="p-2 bg-[#04593f] text-white rounded-lg space-y-0.5 flex flex-col justify-center">
                  <span className="text-[9px] text-emerald-200 font-bold uppercase block">TOTAL PEMBAYARAN</span>
                  <span className="font-black text-xs sm:text-sm block">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Bukti Transfer Image Preview */}
              {order.payment_proof_url ? (
                <div className="pt-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">FOTO BUKTI TRANSFER:</span>
                  <div
                    onClick={() => setZoomImage(order.payment_proof_url || null)}
                    className="relative w-full h-36 bg-slate-200 rounded-xl overflow-hidden border border-slate-300 cursor-pointer group shadow-2xs"
                  >
                    <img
                      src={order.payment_proof_url}
                      alt="Bukti Transfer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity gap-1">
                      <ZoomIn className="w-3.5 h-3.5" /> Klik untuk memperbesar foto
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] font-semibold text-amber-900">
                  Belum ada foto bukti transfer yang diunggah.
                </div>
              )}
            </div>

            {/* Plant Items Table */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                RINCIAN BARANG / TANAMAN ADENIUM
              </span>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Nama Varian</th>
                      <th className="py-2 px-3">Ukuran</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block text-xs">{item.tree_name || item.product_name}</span>
                            {item.tree_code && <span className="text-[10px] text-slate-400 font-normal">Code: {item.tree_code}</span>}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700">
                              Grade {item.grade || 'A'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#04593f]">
                            Rp {((item.quantity || 1) * (item.price || 0)).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-slate-400 font-normal">
                          Belum ada barang.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Callout Box */}
            {order.notes && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px]">
                <span className="font-bold text-amber-950 uppercase block text-[10px]">
                  CATATAN PENGIRIMAN / PACKING KAYU:
                </span>
                <p className="text-amber-900 font-medium italic mt-0.5">"{order.notes}"</p>
              </div>
            )}
          </div>

          {/* Modal Action Buttons Footer */}
          <div className="p-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {onOpenNota && (
                <button
                  onClick={() => onOpenNota(order)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" /> Nota
                </button>
              )}

              {(isOwnerOrAdmin || (isCreatorSales && order.status === 'WAITING_PROCESS')) && onEdit && (
                <button
                  onClick={() => onEdit(order)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit
                </button>
              )}

              {(isOwnerOrAdmin || (isCreatorSales && order.status === 'WAITING_PROCESS')) && onDelete && (
                <button
                  onClick={() => onDelete(order.id)}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {isOwnerOrAdmin && order.status === 'WAITING_PROCESS' && onApprove && (
                <button
                  disabled={isActionLoading}
                  onClick={() => onApprove(order.id)}
                  className="px-3.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Kirim Packing
                </button>
              )}

              {isOwnerOrAdmin && order.status === 'PACKING_COMPLETED' && onOpenShipmentModal && (
                <button
                  onClick={() => onOpenShipmentModal(order)}
                  className="px-3.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" /> Selesaikan Pengiriman
                </button>
              )}

              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP FULLSCREEN ZOOM BUKTI TRANSFER IMAGE */}
      {zoomImage && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white rounded-2xl p-3 shadow-2xl space-y-2">
            <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-slate-900">Bukti Transfer - {order.order_number}</span>
              <button onClick={() => setZoomImage(null)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={zoomImage} alt="Bukti Transfer Zoom" className="w-full max-h-[75vh] object-contain rounded-xl border border-slate-200" />
          </div>
        </div>
      )}
    </>
  );
};
