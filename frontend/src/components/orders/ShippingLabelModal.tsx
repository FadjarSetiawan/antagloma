import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types/order';
import { Tag, Printer, X, Phone, Download, Bluetooth } from 'lucide-react';
import { thermalPrinterService } from '../../utils/thermalPrinter';
import { printElementViaIframe } from '../../utils/printHelper';

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
  const [thermalPreviewUrl, setThermalPreviewUrl] = useState<string | null>(null);

  if (!order) return null;

  const handleDirectBluetoothPrint = async () => {
    setIsBluetoothPrinting(true);
    try {
      const printableEl = document.getElementById('shipping-label-printable');
      if (!printableEl) throw new Error('Elemen pratinjau label tidak ditemukan.');

      // Use TSPL barcode printer protocol for Xprinter XP-420B Label Printer
      await thermalPrinterService.printElementAsTSPL(printableEl, 800, 'label');
    } catch (err: any) {
      alert(err.message || 'Gagal cetak label via Bluetooth.');
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handlePreviewThermalBitmap = async () => {
    try {
      const printableEl = document.getElementById('shipping-label-printable');
      if (!printableEl) throw new Error('Elemen pratinjau label tidak ditemukan.');

      const dataUrl = await thermalPrinterService.generateThermalBitmapDataUrl(printableEl, 800);
      setThermalPreviewUrl(dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat gambar simulasi label thermal.');
    }
  };

  const handlePrint = () => {
    const cleanSubOrder = (subOrderNum || 'label').replace(/[^a-zA-Z0-9-]/g, '_');
    const title = `Label_Pengiriman_${cleanSubOrder}`;
    
    // Blur active button focus to prevent Chrome Android touch event cancellation flicker
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }

    printElementViaIframe('shipping-label-printable', title, 'size: 100mm 150mm;');
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

      const dataUrl = await thermalPrinterService.generateThermalBitmapDataUrl(printableEl, 800);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `SIMULASI_CETAK_THERMAL_STIKER_10X15_${subOrderNum}.png`;
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
                Format stiker 10x15 cm
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
                size: 100mm 150mm;
                margin: 0;
              }

              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100mm !important;
                height: 150mm !important;
                overflow: hidden !important;
              }

              /* Hide non-printable elements completely from document flow */
              .no-print {
                display: none !important;
              }

              #shipping-label-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100mm !important;
                height: 150mm !important;
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
                height: 150mm !important;
              }

              #shipping-label-printable {
                position: relative !important;
                width: 96mm !important;
                height: 146mm !important;
                margin: 0 auto !important;
                padding: 2mm !important;
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

          {/* Label Container Box (Clean borderless sticker layout for 10x15cm thermal paper) */}
          <div className="p-3 space-y-4 font-sans bg-white text-black h-full flex flex-col justify-between min-h-[420px]">
            {/* Header Store & Order ID */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3 pt-1 gap-2">
              <div className="space-y-0.5 min-w-0 flex-1">
                <h1 className="font-extrabold text-base sm:text-lg tracking-wider text-black uppercase leading-normal pt-0.5">
                  ANTAGLOMA FLORIST
                </h1>
                <p className="text-xs font-semibold text-black leading-tight">
                  Spesialis Adenium Bunga Tumpuk
                </p>
                <p className="text-[11px] font-normal text-black leading-tight">
                  WA: 0858-9450-3333 / 0857-3333-1889
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="border-2 border-black px-2.5 py-1 text-[10px] font-bold text-black uppercase inline-block mt-0.5 mb-1 tracking-wider leading-normal text-center">
                  STIKER RESI
                </div>
                <p className="font-extrabold text-sm sm:text-base text-black leading-tight tracking-tight whitespace-nowrap">{subOrderNum}</p>
                <span className="font-bold text-xs text-black uppercase block mt-1">
                  [ {pkgType} ]
                </span>
              </div>
            </div>

            {/* Customer Recipient Section */}
            <div className="border-b-2 border-black pb-3 space-y-1">
              <span className="text-xs font-bold uppercase text-black block tracking-wider">
                PENERIMA / CUSTOMER:
              </span>
              <h2 className="text-base sm:text-xl font-extrabold text-black block leading-tight break-words">{order.customer_name}</h2>
              <p className="text-sm sm:text-base font-bold text-black flex items-center gap-1.5 mt-1">
                <Phone className="w-4 h-4 text-black shrink-0" /> {order.phone}
              </p>
            </div>

            {/* Destination Address Block */}
            <div className="border-b-2 border-black pb-3 space-y-1.5 flex-1">
              <span className="text-xs font-bold uppercase text-black block tracking-wider">
                ALAMAT PENGIRIMAN:
              </span>
              <p className="font-extrabold text-sm sm:text-base text-black leading-snug break-words">
                {[order.district_name ? `Kec. ${order.district_name}` : null, order.regency_name, order.province_name].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs sm:text-sm font-normal text-black leading-relaxed break-words pt-1">
                {order.full_address}
              </p>
            </div>

            {/* Package Summary Box (No weight text as requested) */}
            <div className="border-2 border-black rounded-lg p-2.5 text-xs font-bold text-black flex items-center justify-between bg-slate-50/50 mt-auto shrink-0">
              <span>Isi Paket: {packageInfo?.itemsSummary || 'Tanaman'}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar: Clean Action Buttons */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 no-print">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={handlePreviewThermalBitmap}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Preview simulasi hasil cetak thermal stiker 100mm"
            >
              <Download className="w-4 h-4 shrink-0 text-slate-300" />
              <span className="whitespace-nowrap">Preview Thermal</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer flex-1 justify-center"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Cetak Label</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
      {thermalPreviewUrl && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/70 p-4 no-print" onClick={() => setThermalPreviewUrl(null)}>
          <div className="bg-slate-100 rounded-2xl p-4 max-h-[92vh] max-w-full overflow-auto shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Preview Stiker Thermal 10x15 cm</p>
                <p className="text-[10px] text-slate-500">Raster 1-bit monochrome resolusi tinggi 10x15 cm (100mm x 150mm)</p>
              </div>
              <button type="button" onClick={() => setThermalPreviewUrl(null)} className="p-1.5 bg-slate-200 rounded-lg text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-300 p-4 overflow-auto shadow-inner flex justify-center">
              <div className="bg-white shadow-md p-2" style={{ width: '100mm', minWidth: '100mm' }}>
                <img src={thermalPreviewUrl} alt="Preview stiker label thermal 10x15" className="block w-full h-auto max-h-[60vh] object-contain" style={{ imageRendering: 'pixelated' }} />
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">100mm x 150mm paper · 800 x 1200 dots · 1-bit High-DPI</p>
            <a href={thermalPreviewUrl} download={`SIMULASI_CETAK_THERMAL_STIKER_10X15_${subOrderNum}.png`} className="mt-3 block text-center py-2 bg-slate-800 text-white rounded-xl text-[11px] font-semibold">Download PNG 10x15</a>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

