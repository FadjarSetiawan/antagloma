import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types/order';
import { Tag, Printer, X, Sprout, Phone, Bluetooth, AlertCircle } from 'lucide-react';
import { thermalPrinterService } from '../../utils/thermalPrinter';

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

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ order, packageInfo, onClose }) => {
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);

  if (!order) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanSubOrder = (subOrderNum || 'label').replace(/[^a-zA-Z0-9-]/g, '_');
    document.title = `Label_Pengiriman_${cleanSubOrder}`;
    
    window.print();
    
    // Restore original document title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const handleDirectBluetoothPrint = async () => {
    setIsBluetoothPrinting(true);
    setBtError(null);

    try {
      if (!thermalPrinterService.getConnectedDeviceName()) {
        await thermalPrinterService.connect();
      }

      const printText = `
================================
       ANTAGLOMA FLORIST
     LABEL STIKER PENGIRIMAN
 WA: 0858-9450-3333/0857-3333-1889
================================
RESI/ORDER: ${subOrderNum}
METODE: [ ${pkgType} ]
--------------------------------
PENERIMA:
${order.customer_name}
TELP: ${order.phone}

ALAMAT PENGIRIMAN:
Kec. ${order.district_name || '-'}, ${order.regency_name || '-'}
${order.full_address}
--------------------------------
PENGIRIM: ANTAGLOMA FLORIST
================================
`.trim();

      await thermalPrinterService.printEscPosText(printText);
    } catch (err: any) {
      setBtError(err.message || 'Gagal cetak label via Bluetooth.');
    } finally {
      setIsBluetoothPrinting(false);
    }
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

  const modalContent = (
    <div id="shipping-label-modal-container" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 w-full h-full overflow-y-auto font-sans text-slate-900">
      <div className="bg-white rounded-2xl border border-slate-200 w-[95%] max-w-sm sm:max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
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
                Format stiker 10x10 cm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {thermalPrinterService.isSupported() && (
              <button
                type="button"
                disabled={isBluetoothPrinting}
                onClick={handleDirectBluetoothPrint}
                className="min-h-9 px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Cetak langsung via Bluetooth Printer"
              >
                <Bluetooth className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isBluetoothPrinting ? 'Proses...' : 'Cetak Bluetooth'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="min-h-9 px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-lg text-[10.5px] font-normal flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Browser</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {btError && (
          <div className="p-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-[10.5px] font-medium flex items-center justify-between no-print">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{btError}</span>
            </div>
            <button onClick={() => setBtError(null)} className="text-rose-600 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Printable Shipping Label Body Container */}
        <div id="shipping-label-printable" className="p-3 sm:p-4 overflow-y-auto print-area text-slate-900 font-sans text-xs flex-1 flex flex-col justify-center">
          {/* Print specific style overrides */}
          <style>{`
            @media print {
              /* Hide main layout elements */
              #no-print-wrapper,
              .no-print {
                display: none !important;
              }

              /* Reset body */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100mm !important;
                height: 100mm !important;
              }

              /* Position printable container */
              #shipping-label-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                display: block !important;
                visibility: visible !important;
              }

              #shipping-label-modal-container > div {
                border: none !important;
                box-shadow: none !important;
                width: 100mm !important;
                height: 100mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }

              #shipping-label-printable {
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                visibility: visible !important;
                width: 100mm !important;
                height: 100mm !important;
                padding: 4mm !important;
                box-sizing: border-box !important;
              }

              #shipping-label-printable * {
                visibility: visible !important;
              }

              @page {
                size: 100mm 100mm;
                margin: 0;
              }
            }
          `}</style>

          {/* Shipping Sticker Box */}
          <div className="border border-black p-3 space-y-2 bg-white flex flex-col justify-between h-full min-h-[280px]">
            {/* Header Store & Package Barcode */}
            <div className="border-b border-black pb-2 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-5 h-5 text-black" />
                  <span className="font-bold text-[12px] uppercase tracking-wide text-black block leading-none">
                    ANTAGLOMA FLORIST
                  </span>
                </div>
                <span className="text-[10px] text-black font-semibold block mt-1">Pengirim: Antagloma Florist</span>
                <div className="text-[9.5px] text-black font-medium leading-normal mt-0.5">
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-black" /> 0858-9450-3333 / 0857-3333-1889</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="inline-block px-1.5 py-0.5 border border-black text-black font-bold text-[8.5px] uppercase tracking-wider">
                  [ {pkgType} ]
                </span>
                <p className="font-bold text-[11px] text-black block mt-1 break-words">{subOrderNum}</p>
              </div>
            </div>

            {/* Receiver Name & Address Section (Monochrome clean layout) */}
            <div className="p-2 border border-black rounded space-y-1.5 flex-1 flex flex-col justify-center text-xs my-1">
              <span className="text-[9px] font-bold uppercase text-black block tracking-wider">
                PENERIMA / ALAMAT PENGIRIMAN:
              </span>

              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-black block leading-tight">{order.customer_name}</h2>
                <p className="text-[11px] font-bold text-black flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-black" /> {order.phone}
                </p>
              </div>

              <div className="pt-1.5 border-t border-black text-xs font-semibold text-black leading-snug">
                <p className="font-bold text-black">
                  Kec. {order.district_name || '-'}, {order.regency_name || '-'}
                </p>
                <p className="text-black font-bold text-[11px] mt-0.5 leading-relaxed">
                  {order.full_address}
                </p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-black pt-1 flex items-center justify-between text-[8px] font-bold text-black uppercase tracking-widest">
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

  return createPortal(modalContent, document.body);
};

