import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types/order';
import { Tag, Printer, X, Phone, Download } from 'lucide-react';
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

  const handleRawBTPrint = async () => {
    try {
      const printableEl = document.getElementById('shipping-label-printable');
      if (!printableEl) throw new Error('Elemen pratinjau label tidak ditemukan.');

      await thermalPrinterService.sendToRawBT(printableEl, 576);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim label ke aplikasi RawBT.');
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
  const rawPkgType = packageInfo?.packageType || order.delivery_method || 'Fullset';
  const normalizedPkgType = rawPkgType.trim().toLowerCase();
  const isWoodPacking = order.delivery_method === 'Packing Kayu' || normalizedPkgType === 'packing kayu';
  const pkgType = isWoodPacking
    ? 'Packing Kayu'
    : normalizedPkgType === 'fullset'
      ? 'Fullset'
      : ['non-fullset', 'non fullset', 'non_fullset'].includes(normalizedPkgType)
        ? 'Non Fullset'
        : rawPkgType;

  const getCleanWeight = () => {
    if (!packageInfo?.weightInfo) return '1 kg';
    const w = packageInfo.weightInfo.trim();
    if (w.toLowerCase().includes('mengikuti') || w.toLowerCase().includes('konfigurasi') || w.toLowerCase().includes('belum')) {
      return '1 kg';
    }
    return w;
  };

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

        {/* Printable Shipping Label Body Container */}
        <div id="shipping-label-printable" className="p-3 sm:p-4 overflow-y-auto print-area text-slate-900 font-sans text-xs flex-1 flex flex-col justify-between">
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
                display: block !important;
                align-items: flex-start !important;
                justify-content: flex-start !important;
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
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
              }

              #shipping-label-printable {
                position: relative !important;
                width: 96mm !important;
                height: 96mm !important;
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

          {/* Label Container Box (Clean borderless sticker layout for 10x10cm thermal paper) */}
          <div className="p-2 space-y-2.5 font-sans bg-white text-black h-full flex flex-col justify-between">
            {/* Header Store & Order ID */}
            <div className="flex items-start justify-between border-b-2 border-black pb-2 pt-0.5 gap-2">
              <div className="space-y-0.5 min-w-0 flex-1">
                <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-black uppercase leading-normal pt-0.5">
                  ANTAGLOMA FLORIST
                </h1>
                <p className="text-[10px] font-semibold text-black leading-tight">
                  Spesialis Adenium Bunga Tumpuk
                </p>
                <p className="text-[9.5px] font-normal text-black leading-tight">
                  WA: 0858-9450-3333 / 0857-3333-1889
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="border border-black px-2 py-1 text-[9px] font-bold text-black uppercase inline-block mt-0.5 mb-1 tracking-wider leading-normal text-center">
                  STIKER RESI
                </div>
                <p className="font-extrabold text-xs sm:text-sm text-black leading-tight tracking-tight whitespace-nowrap">{subOrderNum}</p>
                <span className="font-bold text-[10px] text-black uppercase block mt-0.5">
                  [ {pkgType} ]
                </span>
              </div>
            </div>

            {/* Customer Recipient Section */}
            <div className="border-b border-black pb-2 space-y-0.5">
              <span className="text-[9.5px] font-bold uppercase text-black block tracking-wider">
                PENERIMA / CUSTOMER:
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-black block leading-tight break-words">{order.customer_name}</h2>
              <p className="text-xs sm:text-sm font-bold text-black flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-black shrink-0" /> {order.phone}
              </p>
            </div>

            {/* Destination Address Block */}
            <div className="border-b border-black pb-2 space-y-1 flex-1">
              <span className="text-[9.5px] font-bold uppercase text-black block tracking-wider">
                ALAMAT PENGIRIMAN:
              </span>
              <p className="font-bold text-xs text-black leading-snug break-words">
                {[order.district_name ? `Kec. ${order.district_name}` : null, order.regency_name, order.province_name].filter(Boolean).join(', ')}
              </p>
              <p className="text-[11px] sm:text-xs font-normal text-black leading-relaxed break-words pt-0.5">
                {order.full_address}
              </p>
            </div>

            {/* Package Summary Box */}
            <div className="border border-black rounded-lg p-2 text-[10px] font-bold text-black flex items-center justify-between bg-slate-50/50 mt-auto shrink-0">
              <span>Isi Paket: {packageInfo?.itemsSummary || 'Tanaman'}</span>
              <span>Berat: {getCleanWeight()}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar: Clean Action Buttons */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 no-print">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={handleRawBTPrint}
              className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Cetak langsung menggunakan Aplikasi RawBT di Android"
            >
              <Printer className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="whitespace-nowrap">RawBT (App)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadThermalBitmap}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Unduh Gambar Hasil Cetak Thermal"
            >
              <Download className="w-4 h-4 shrink-0 text-slate-300" />
              <span className="whitespace-nowrap">Tes Gambar</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Browser</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

