import React from 'react';
import { Order } from '../../types/order';
import { Printer, X, Tag, Truck, Sprout, Phone } from 'lucide-react';

interface ShippingLabelModalProps {
  order: Order | null;
  packageInfo?: {
    subOrderNumber: string;
    packageType: string;
    itemsSummary: string;
    weightInfo: string;
  } | null;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  order,
  packageInfo,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subOrderNum = packageInfo?.subOrderNumber || `${order.order_number}-A`;
  const pkgType = packageInfo?.packageType || 'Fullset';
  const weightText = packageInfo?.weightInfo || 'Tanpa Berat';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 w-full h-full overflow-y-auto no-print font-sans text-slate-900">
      <div className="bg-white rounded-2xl border border-slate-200 w-[95%] max-w-sm sm:max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#04593f] text-white flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Pratinjau Label Alamat Pengiriman
              </h3>
              <p className="text-[10px] text-slate-400 font-normal">
                Label stiker thermal pengiriman paket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Shipping Label Body Container */}
        <div className="p-4 overflow-y-auto print-area text-slate-900 font-sans text-xs">
          {/* Print specific style overrides */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-area, .print-area * {
                visibility: visible;
              }
              .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 4mm !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: portrait;
                margin: 4mm;
              }
            }
          `}</style>

          {/* Shipping Sticker Box */}
          <div className="border-2 border-slate-900 rounded-2xl p-4 space-y-3 bg-white">
            {/* Header Store & Package Barcode */}
            <div className="border-b-2 border-slate-900 pb-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-[#04593f]" />
                  <span className="font-black text-sm uppercase tracking-wider text-slate-900 block leading-none">
                    ANTAGLOMA FLORIST
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  Pengirim: Antagloma Kebun (+62 858-8180-8740)
                </span>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[#04593f] font-bold text-[10px] rounded uppercase tracking-wider">
                  {pkgType}
                </span>
                <p className="font-black text-sm text-slate-900 block mt-0.5">{subOrderNum}</p>
              </div>
            </div>

            {/* Receiver Name & Address Large Box */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">
                PENERIMA / ALAMAT PENGIRIMAN:
              </span>

              <div>
                <h2 className="text-base font-bold text-slate-900 block leading-tight">{order.customer_name}</h2>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#04593f]" /> {order.phone}
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-200 text-xs font-semibold text-slate-800 leading-snug">
                <p className="font-bold text-slate-900">
                  {[order.district_name, order.regency_name, order.province_name].filter(Boolean).join(', ')}
                </p>
                <p className="text-slate-700 font-medium text-[11px] mt-0.5">{order.full_address}</p>
              </div>
            </div>

            {/* Expedited / Delivery Method & Weight info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-100 border border-slate-300 rounded-lg">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">KURIR / KURIR METODE:</span>
                <span className="font-bold text-slate-900 block flex items-center gap-1 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-[#04593f]" /> {order.delivery_method}
                </span>
              </div>

              <div className="p-2 bg-slate-100 border border-slate-300 rounded-lg">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">BERAT PAKET:</span>
                <span className="font-bold text-slate-900 block mt-0.5">{weightText}</span>
              </div>
            </div>

            {/* Notes if present */}
            {order.notes && (
              <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-[10px]">
                <span className="font-bold text-amber-950 uppercase block text-[9px]">CATATAN PENGIRIMAN:</span>
                <p className="text-amber-900 font-medium italic mt-0.5">"{order.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0 no-print">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
