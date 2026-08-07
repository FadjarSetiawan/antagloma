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
  Wallet,
  Building2,
  FileText,
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-3 sm:p-6 overflow-y-auto w-full h-full">
        <div className="bg-white rounded-3xl border-2 border-slate-200 w-[95%] max-w-lg md:max-w-3xl lg:max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header Modal */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">{order.order_number}</h3>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">Tanggal Order: {formattedDate}</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm font-sans text-slate-900">
            {/* Status Timeline */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-extrabold uppercase text-slate-500 block mb-3">
                STATUS TIMELINE ORDER
              </span>
              <StatusTimeline status={order.status} />
            </div>

            {/* Customer & Shipping Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-500 block border-b border-slate-200 pb-2">
                INFORMASI PEMESAN & PENGIRIMAN
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                    <User className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <span className="text-sm">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Phone className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <span>{order.phone}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                    <Truck className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <span className="text-sm">{order.delivery_method}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 font-bold">
                    <MapPin className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">
                      {[order.district_name, order.regency_name, order.province_name].filter(Boolean).join(', ')}
                      <br />
                      {order.full_address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RINCIAN PEMBAYARAN & FOTO BUKTI TRANSFER */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-500 block border-b border-slate-200 pb-2">
                RINCIAN PEMBAYARAN & BUKTI TRANSFER
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">METODE PEMBAYARAN</span>
                  <span className="font-extrabold text-slate-900 block">{order.payment_method || 'Transfer Bank'}</span>
                  {order.bank_name && <span className="text-slate-500 font-bold text-[11px] block">Bank: {order.bank_name}</span>}
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">ONGKOS KIRIM PEMBELI</span>
                  <span className="font-extrabold text-slate-900 block">
                    {shippingCost > 0 ? `Rp ${shippingCost.toLocaleString('id-ID')}` : 'Rp 0 (Ambil di Lokasi)'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#04593f] text-white rounded-xl space-y-0.5">
                  <span className="text-[10px] text-emerald-200 font-extrabold uppercase block">TOTAL PEMBAYARAN</span>
                  <span className="font-black text-sm block">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Bukti Transfer Image Preview */}
              {order.payment_proof_url ? (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1.5">FOTO BUKTI TRANSFER / PEMBAYARAN:</span>
                  <div
                    onClick={() => setZoomImage(order.payment_proof_url || null)}
                    className="relative w-full h-48 bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group shadow-xs"
                  >
                    <img
                      src={order.payment_proof_url}
                      alt="Bukti Transfer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-extrabold text-xs transition-opacity gap-1.5">
                      <ZoomIn className="w-4 h-4" /> Klik untuk memperbesar foto bukti transfer
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
                  Belum ada foto bukti transfer yang diunggah.
                </div>
              )}
            </div>

            {/* Plant Items Table */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase text-slate-500 block">
                RINCIAN BARANG / TANAMAN ADENIUM
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4">Nama Varian</th>
                      <th className="py-3 px-4">Bonggol / Ukuran</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 block text-xs sm:text-sm">{item.tree_name || item.product_name}</span>
                            {item.tree_code && <span className="text-xs text-slate-500 font-semibold">Code: {item.tree_code}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-extrabold">
                              Grade {item.grade || 'A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-black text-sm">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">
                            Rp {((item.quantity || 1) * (item.price || 0)).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 font-medium">
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
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs">
                <span className="font-extrabold text-amber-950 uppercase block">
                  CATATAN PENGIRIMAN / PACKING KAYU:
                </span>
                <p className="text-amber-900 font-bold italic mt-0.5">"{order.notes}"</p>
              </div>
            )}
          </div>

          {/* Modal Action Buttons Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenNota && (
                <button
                  onClick={() => onOpenNota(order)}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-700" /> Nota Packing
                </button>
              )}

              {(isOwnerOrAdmin || (isCreatorSales && order.status === 'WAITING_PROCESS')) && onEdit && (
                <button
                  onClick={() => onEdit(order)}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" /> Edit
                </button>
              )}

              {isOwnerOrAdmin && onDelete && (
                <button
                  onClick={() => onDelete(order.id)}
                  className="px-4 py-2.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-rose-200 transition-colors shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwnerOrAdmin && order.status === 'WAITING_PROCESS' && onApprove && (
                <button
                  disabled={isActionLoading}
                  onClick={() => onApprove(order.id)}
                  className="px-5 py-2.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Kirim Packing
                </button>
              )}

              {isOwnerOrAdmin && order.status === 'PACKING_COMPLETED' && onOpenShipmentModal && (
                <button
                  onClick={() => onOpenShipmentModal(order)}
                  className="px-5 py-2.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" /> Selesaikan Pengiriman
                </button>
              )}

              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP FULLSCREEN ZOOM BUKTI TRANSFER IMAGE */}
      {zoomImage && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex justify-between items-center px-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900">Foto Bukti Transfer Pembayaran - {order.order_number}</span>
              <button onClick={() => setZoomImage(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={zoomImage} alt="Bukti Transfer Zoom" className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-200" />
          </div>
        </div>
      )}
    </>
  );
};
