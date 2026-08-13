import React from 'react';
import { Order } from '../../types/order';
import { Printer, X, Tag, Sprout, Phone } from 'lucide-react';

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
    const originalTitle = document.title;
    const cleanSubOrder = subOrderNum.replace(/[^a-zA-Z0-9-]/g, '_');
    document.title = `Label_Alamat_${cleanSubOrder}`;
    
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const subOrderNum = packageInfo?.subOrderNumber || `${order.order_number}-A`;
  const rawPkgType = packageInfo?.packageType || 'Fullset';
  const normalizedPkgType = rawPkgType.trim().toLowerCase();
  const pkgType = normalizedPkgType === 'fullset'
    ? 'Fullset'
    : ['non-fullset', 'non fullset', 'non_fullset'].includes(normalizedPkgType)
      ? 'Non Fullset'
      : normalizedPkgType === 'packing kayu'
        ? 'Packing Kayu'
        : rawPkgType;

  return (
    <div id="shipping-label-modal-container" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 w-full h-full overflow-y-auto no-print font-sans text-slate-900">
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
              className="min-h-9 px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-lg text-[10.5px] font-normal flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
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
        <div id="shipping-label-printable" className="p-3 sm:p-4 overflow-y-auto print-area text-slate-900 font-sans text-xs flex-1 flex flex-col justify-center">
          {/* Print specific style overrides */}
          <style>{`
            @media print {
              html, body {
                width: 100mm !important;
                height: 100mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              body * {
                visibility: hidden !important;
              }
              #shipping-label-printable,
              #shipping-label-printable * {
                visibility: visible !important;
              }
              #shipping-label-printable {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
                max-width: 100mm !important;
                margin: 0 !important;
                padding: 4mm !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                display: block !important;
                z-index: 9999999 !important;
              }
              .no-print {
                display: none !important;
                visibility: hidden !important;
              }
              @page {
                size: 100mm 100mm;
                margin: 0;
              }
            }
          `}</style>

          {/* Shipping Sticker Box */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-3 bg-white flex flex-col justify-between shadow-xs h-full min-h-[280px]">
            {/* Header Store & Package Barcode */}
            <div className="border-b border-slate-300 pb-2.5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-[#04593f]" />
                  <span className="font-bold text-[11.5px] uppercase tracking-wide text-slate-900 block leading-none">
                    ANTAGLOMA FLORIST
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">Pengirim: Antagloma Florist</span>
                <div className="text-[9px] text-slate-500 leading-normal mt-0.5">
                  <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> 0858-9450-3333 / 0857-3333-1889</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[#04593f] font-semibold text-[8px] rounded uppercase tracking-wider">
                  {pkgType}
                </span>
                <p className="font-semibold text-[10.5px] text-slate-900 block mt-1 break-words">{subOrderNum}</p>
              </div>
            </div>

            {/* Receiver Name & Address Large Box */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 flex-1 flex flex-col justify-center text-xs my-1">
              <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">
                PENERIMA / ALAMAT PENGIRIMAN:
              </span>

              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900 block leading-tight">{order.customer_name}</h2>
                <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {order.phone}
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-200 text-xs font-semibold text-slate-800 leading-snug">
                <p className="font-bold text-slate-900">
                  Kec. {order.district_name || '-'}, {order.regency_name || '-'}
                </p>
                <p className="text-slate-700 font-medium text-[11px] mt-0.5 leading-relaxed">
                  {order.full_address}
                </p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Antagloma Florist</span>
              <span>Stiker Alamat Thermal 10x10 cm</span>
            </div>

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
