import React, { useState } from 'react';
import { Order, OrderItem, PackingImage } from '../../types/order';
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
  Download,
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
  const isOwner = role === 'owner';

  const formattedDate = order.order_date
    ? new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : '-';

  const grossPlantTotalPrice = order.items
    ? order.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    : 0;
  const plantTotalPrice = Math.max(0, grossPlantTotalPrice - (Number(order.return_total) || 0));
  const totalItemQuantity = order.items
    ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    : 0;
  const configuredItemQuantity = (order.packages || []).reduce(
    (sum, pkg) => sum + (pkg.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
    0,
  );
  const isPartialConfiguration =
    order.status === 'WAITING_PACKING' &&
    configuredItemQuantity > 0 &&
    configuredItemQuantity < totalItemQuantity;
  const shippingCost = order.buyer_shipping_cost || 0;
  const grandTotal = plantTotalPrice + shippingCost;
  const itemPricing = (item: OrderItem) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const sellingTotal = Number(item.price) || 0;
    const configuredDiscount = Number(item.discount) || 0;
    const standardTotal = Math.max(0, Number(item.standard_price) || 0) * quantity;
    // Older orders may not have a stored discount. In that case derive it from
    // the historical standard price when it is available.
    const discount = configuredDiscount > 0
      ? configuredDiscount
      : Math.max(0, standardTotal - sellingTotal);
    const normalTotal = standardTotal > 0 ? standardTotal : sellingTotal + discount;
    return { sellingTotal, discount, normalTotal };
  };
  const totalNormalPlantPrice = (order.items || []).reduce((sum, item) => sum + itemPricing(item).normalTotal, 0);
  const totalSalesDiscount = (order.items || []).reduce((sum, item) => sum + itemPricing(item).discount, 0);

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto w-full h-full font-sans">
        <div className="bg-white rounded-2xl border border-slate-200 w-[95%] max-w-lg md:max-w-2xl lg:max-w-3xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header Modal */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{order.order_number}</h3>
                {isPartialConfiguration ? (
                  <span className="rounded-xl border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-950">
                    Sedang Diatur ({configuredItemQuantity}/{totalItemQuantity})
                  </span>
                ) : <OrderStatusBadge status={order.status} />}
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
            {/* Verified Payment Notice Banner for WAITING_PACKING */}
            {order.status === 'WAITING_PACKING' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-xl space-y-0.5 text-xs text-emerald-950 shadow-2xs">
                <span className="font-bold text-[#04593f] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#04593f]" />
                  <span>{isPartialConfiguration ? `Paket sedang diatur (${configuredItemQuantity}/${totalItemQuantity})` : 'Pembayaran terverifikasi, menunggu buat paket'}</span>
                </span>
                <p className="text-[11px] text-slate-600 font-medium pl-5.5">
                  {isPartialConfiguration
                    ? `${configuredItemQuantity} dari ${totalItemQuantity} tanaman sudah dialokasikan. Admin masih mengatur sisa paket pengiriman.`
                    : 'Pembayaran order telah disetujui admin. Saat ini menunggu pembuatan paket pengiriman oleh admin.'}
                </p>
              </div>
            )}

            {/* Customer & Shipping Info Box */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  INFORMASI PEMESAN & PENGIRIMAN
                </span>
                {isOwnerOrAdmin && onEdit && ['WAITING_PROCESS', 'WAITING_PACKING'].includes(order.status) && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(order);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/60 hover:bg-emerald-200/60 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Edit Informasi Pemesan"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Edit Info</span>
                  </button>
                )}
              </div>

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
                  {isOwnerOrAdmin && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-900">
                      <User className="w-3.5 h-3.5 text-[#04593f] flex-shrink-0" />
                      <span>Sales pembuat order: {order.creator?.name || 'Tidak diketahui'}</span>
                    </div>
                  )}
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
                    Rp {(order.buyer_shipping_cost || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-2 bg-white border border-slate-200/80 rounded-lg space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">TOTAL ORDER</span>
                  <span className="font-extrabold text-[#04593f] block">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* SALES COMMISSION ACCRUAL BOX (Only visible to Sales staff) */}
              {role === 'sales' && (
                (() => {
                  const rate = user?.commission_rate ?? 5;
                  const commissionAmount = Math.round(plantTotalPrice * (rate / 100));
                  return (
                    <div className="p-3 bg-[#04593f] text-white rounded-xl flex items-center justify-between text-xs mt-2 shadow-2xs">
                      <div>
                        <span className="text-[10px] text-emerald-200 font-bold block uppercase tracking-wider">
                          KOMISI SALES ({rate}%)
                        </span>
                        <span className="text-[11px] text-emerald-100 font-medium mt-0.5 block">
                          {order.status === 'WAITING_PROCESS'
                            ? `Estimasi ${rate}% dari Total Harga Tanaman. Menjadi komisi final setelah diverifikasi Admin.`
                            : `Hitungan: Rp ${plantTotalPrice.toLocaleString('id-ID')} × ${rate}%`}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-white text-base block">
                          Rp {commissionAmount.toLocaleString('id-ID')}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                          order.status === 'WAITING_PROCESS'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {order.status === 'WAITING_PROCESS' ? 'Menunggu Verifikasi Admin' : '✓ Cair / Terverifikasi'}
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Bukti Transfer Image Attachment */}
              {order.payment_proof_url && (
                <div className="pt-1">
                  <span className="text-xs text-slate-600 font-bold block mb-1">Bukti Transfer Pembayaran:</span>
                  <div
                    onClick={() => setZoomImage(order.payment_proof_url || null)}
                    className="relative w-28 h-28 rounded-xl border border-slate-200 overflow-hidden cursor-pointer group shadow-2xs"
                  >
                    <img
                      src={order.payment_proof_url}
                      alt="Bukti Transfer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOTO TANAMAN PESANAN (SEBELUM PACKING) */}
            {order.plant_photo_url && (
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <span className="text-xs font-heading font-extrabold uppercase text-slate-700 block border-b border-slate-200/80 pb-1.5 tracking-wider">
                  Foto Tanaman Pesanan (Sebelum Packing)
                </span>

                <div className="flex items-start gap-3 pt-0.5">
                  <div
                    onClick={() => setZoomImage(order.plant_photo_url || null)}
                    className="relative w-32 h-32 rounded-xl border border-slate-200 overflow-hidden cursor-pointer group shadow-2xs shrink-0"
                  >
                    <img
                      src={order.plant_photo_url}
                      alt="Foto Tanaman Pesanan"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Foto dokumentasi tanaman yang diunggah Sales saat pembuatan order untuk pengecekan Admin & Packing.
                    </p>
                    <a
                      href={order.plant_photo_url}
                      download={`foto-tanaman-${order.order_number}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#04593f] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Unduh Foto Tanaman</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* FOTO BUKTI PACKING TANAMAN (Jika ada) */}
            {order.packing_images && order.packing_images.length > 0 && (
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-200/80 pb-1.5 tracking-wider">
                  FOTO BUKTI PACKING KEBUAN
                </span>

                <div className="flex gap-3 flex-wrap pt-0.5">
                  {order.packing_images.map((img: PackingImage) => (
                    <div key={img.id} className="space-y-1">
                      <div
                        onClick={() => setZoomImage(img.image_url)}
                        className="relative w-28 h-28 rounded-xl border border-slate-200 overflow-hidden cursor-pointer group shadow-2xs"
                      >
                        <img
                          src={img.image_url}
                          alt="Foto Packing"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>
                      <a
                        href={img.image_url}
                        download={`foto-packing-${order.order_number}-${img.id}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-28 py-1 bg-[#04593f] hover:bg-emerald-900 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3 h-3 text-white" />
                        <span>Unduh Foto</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DAFTAR ITEM TANAMAN */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-200/80 pb-1.5 tracking-wider">
                RINCIAN ITEM TANAMAN (& BONSAI POT)
              </span>

              <div className="divide-y divide-slate-200/60 font-medium text-xs text-slate-800">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    let cleanTitle = item.product_name.replace(/\s*\(Grade\s+[^)]+\)/i, '').trim();
                    if (item.tree_code && !cleanTitle.includes(`(${item.tree_code.toUpperCase()})`)) {
                      if (item.tree_name) {
                        cleanTitle = `${item.tree_name.toUpperCase()} (${item.tree_code.toUpperCase()})`;
                      } else {
                        cleanTitle = `${cleanTitle.toUpperCase()} (${item.tree_code.toUpperCase()})`;
                      }
                    } else if (item.tree_name && item.tree_code) {
                      cleanTitle = `${item.tree_name.toUpperCase()} (${item.tree_code.toUpperCase()})`;
                    }

                    const pricing = itemPricing(item);
                    return (
                      <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block text-xs">{cleanTitle}</span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-black rounded uppercase">
                            GRADE {item.grade || 'A'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 block text-xs">x{item.quantity}</span>
                          {isOwner && pricing.discount > 0 && <><span className="text-[10px] text-slate-400 line-through block">Rp {pricing.normalTotal.toLocaleString('id-ID')}</span><span className="text-[10px] text-rose-600 font-bold block">Diskon −Rp {pricing.discount.toLocaleString('id-ID')}</span></>}
                          <span className="text-[10px] text-slate-700 font-extrabold block">Rp {pricing.sellingTotal.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-2 text-center text-slate-400">Tidak ada detail item tanaman.</p>
                )}
              </div>
              {order.items && order.items.length > 0 && (
                <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600"><span>Total item</span><span>{totalItemQuantity.toLocaleString('id-ID')} tanaman</span></div>
                  {isOwner && <><div className="flex items-center justify-between text-[10px] font-semibold text-slate-600"><span>Total harga normal</span><span>Rp {totalNormalPlantPrice.toLocaleString('id-ID')}</span></div>
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-700"><span>Diskon diberikan sales</span><span>−Rp {totalSalesDiscount.toLocaleString('id-ID')}</span></div></>}
                  <div className="flex items-center justify-between border-t border-amber-200 pt-1.5 text-xs font-black text-slate-900"><span>Total harga jual tanaman</span><span>Rp {plantTotalPrice.toLocaleString('id-ID')}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Action Buttons */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <div className="flex items-center gap-2">
              {/* ADMIN / OWNER VERIFICATION ACTION BUTTON */}
              {isOwnerOrAdmin && order.status === 'WAITING_PROCESS' && onApprove && (
                <button
                  onClick={() => onApprove(order.id)}
                  disabled={isActionLoading}
                  className="px-3.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Verifikasi Pembayaran</span>
                </button>
              )}

              {/* ADMIN / OWNER PRINT NOTA ACTION BUTTON */}
              {isOwnerOrAdmin && !order.packages?.length && (order.status === 'WAITING_PACKING' || order.status === 'PACKING_COMPLETED' || order.status === 'COMPLETED') && onOpenNota && (
                <button
                  onClick={() => onOpenNota(order)}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Cetak Nota</span>
                </button>
              )}

              {/* ADMIN / OWNER RESI SHIPMENT ACTION BUTTON */}
              {isOwnerOrAdmin && order.status === 'PACKING_COMPLETED' && onOpenShipmentModal && (
                <button
                  onClick={() => onOpenShipmentModal(order)}
                  className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4 text-white" />
                  <span>Input Resi</span>
                </button>
              )}

              {/* EDIT BUTTON (SALES CAN ONLY EDIT IF UNVERIFIED - WAITING_PROCESS) */}
              {isOwnerOrAdmin && onEdit && ['WAITING_PROCESS', 'WAITING_PACKING'].includes(order.status) && (
                <button
                  onClick={() => onEdit(order)}
                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl cursor-pointer"
                  title="Edit Order"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              {/* DELETE BUTTON (SALES CAN ONLY DELETE IF UNVERIFIED - WAITING_PROCESS) */}
              {isOwnerOrAdmin && onDelete && (
                <button
                  onClick={() => onDelete(order.id)}
                  className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl cursor-pointer"
                  title="Hapus Order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Image Lightbox Overlay */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]">
            <img src={zoomImage} alt="Enlarged View" className="w-full h-full object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
