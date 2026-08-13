import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types/order';
import { Tag, Printer, X, Sprout, Phone, Bluetooth, AlertCircle, Download } from 'lucide-react';
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
      await thermalPrinterService.ensureConnected();

      const printableEl = document.getElementById('shipping-label-printable');
      if (!printableEl) throw new Error('Elemen pratinjau label tidak ditemukan.');

      await thermalPrinterService.printElementAsBitmap(printableEl, 576);
    } catch (err: any) {
      setBtError(err.message || 'Gagal cetak label via Bluetooth.');
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handleDownloadThermalBitmap = async () => {
    try {
      const printableEl = document.getElementById('shipping-label-printable');
      if (!printableEl) throw new Error('Elemen pratinjau label tidak ditemukan.');

      const dataUrl = await thermalPrinterService.generateThermalBitmapDataUrl(printableEl, 576);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `SIMULASI_CETAK_THERMAL_STIKER_10X10_${subOrderNum}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat gambar simulasi label thermal.');
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
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#04593f] text-white flex items-center justify-center font-bold shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Pratinjau Label Alamat Pengiriman
              </h3>
              <p className="text-[10px] text-slate-500 font-normal">
                Format stiker 10x10 cm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
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
              @page {
                size: 100mm 100mm;
                margin: 0;
              }

              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100mm !important;
                height: 100mm !important;
                overflow: hidden !important;
              }

              /* Hide non-printable elements completely from document flow */
              body > *:not(#shipping-label-modal-container),
              .no-print {
                display: none !important;
              }

              #shipping-label-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
                box-shadow: none !important;
                border: none !important;
              }

              #shipping-label-modal-container > div {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
              }

              #shipping-label-printable {
                position: relative !important;
                width: 98mm !important;
                height: 98mm !important;
                margin: 0 auto !important;
                padding: 1.5mm !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                overflow: hidden !important;
              }

              /* Disable multi-page overflow breaks */
              *, *::before, *::after {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}</style>

          {/* Label Container Box */}
          <div className="border-2 border-black p-3 rounded-lg space-y-2 font-sans bg-white text-black">
            {/* Header Store & Order ID */}
            <div className="flex items-start justify-between border-b-2 border-black pb-2 pt-1">
              <div>
                <h1 className="font-extrabold text-sm tracking-wide text-black uppercase leading-normal pt-0.5">
                  ANTAGLOMA FLORIST
                </h1>
                <p className="text-[9px] font-bold text-black mt-0.5">
                  WA: 0858-9450-3333 / 0857-3333-1889
                </p>
              </div>

              <div className="text-right">
                <div className="border border-black px-2 py-1 text-[8.5px] font-extrabold text-black uppercase inline-flex items-center justify-center mt-1 mb-1 tracking-wider leading-none">
                  STIKER RESI
                </div>
                <p className="font-extrabold text-xs text-black leading-tight">{subOrderNum}</p>
                <span className="font-extrabold text-[9.5px] text-black uppercase block">
                  [ {pkgType} ]
                </span>
              </div>
            </div>

            {/* Destination Address Block */}
            <div className="space-y-1.5">
              <div>
                <span className="text-[9px] font-bold uppercase text-black block tracking-wider">
                  PENERIMA:
                </span>
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

        {/* Modal Footer Bar: Clean Action Buttons Row */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 no-print">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {thermalPrinterService.isSupported() && (
              <button
                type="button"
                disabled={isBluetoothPrinting}
                onClick={handleDirectBluetoothPrint}
                className="py-2 px-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Bluetooth className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="whitespace-nowrap">{isBluetoothPrinting ? 'Proses...' : 'Bluetooth'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadThermalBitmap}
              className="py-2 px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Unduh Gambar Hasil Cetak Thermal (100% Persis Hasil Cetakan Bluetooth)"
            >
              <Download className="w-3.5 h-3.5 shrink-0 text-slate-300" />
              <span className="whitespace-nowrap">Tes Gambar</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-2.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Browser</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

