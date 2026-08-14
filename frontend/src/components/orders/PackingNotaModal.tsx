import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderPackage } from '../../types/order';
import { Printer, X, Download, Bluetooth } from 'lucide-react';
import { thermalPrinterService } from '../../utils/thermalPrinter';

interface PackingNotaModalProps {
  order: Order | null;
  packageInfo?: OrderPackage | null;
  onClose: () => void;
}

export const PackingNotaModal: React.FC<PackingNotaModalProps> = ({ order, packageInfo, onClose }) => {
  const [customNotes, setCustomNotes] = useState<string>(order?.notes || '');
  const [thermalPreviewUrl, setThermalPreviewUrl] = useState<string | null>(null);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);

  useEffect(() => {
    if (order) {
      setCustomNotes(order.notes || '');
    }
  }, [order]);

  if (!order) return null;

  const handleDirectBluetoothPrint = async () => {
    setIsBluetoothPrinting(true);
    try {
      const printableEl = document.getElementById('packing-nota-printable');
      if (!printableEl) throw new Error('Elemen pratinjau nota tidak ditemukan.');

      await thermalPrinterService.printElementAsBitmap(printableEl, 576, 'nota');
    } catch (err: any) {
      alert(err.message || 'Gagal cetak nota via Bluetooth.');
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanOrderNumber = (order.order_number || 'order').replace(/[^a-zA-Z0-9-]/g, '_');
    const cleanPkgLetter = packageInfo ? `-${packageInfo.letter}` : '';
    document.title = `Nota_Packing_${cleanOrderNumber}${cleanPkgLetter}`;
    
    window.print();
    
    // Restore original document title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const handleRawBTPrint = async () => {
    try {
      const printableEl = document.getElementById('packing-nota-printable');
      if (!printableEl) throw new Error('Elemen pratinjau nota tidak ditemukan.');

      await thermalPrinterService.sendToRawBT(printableEl, 576);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim nota ke aplikasi RawBT.');
    }
  };

  const handlePreviewThermalBitmap = async () => {
    try {
      const printableEl = document.getElementById('packing-nota-printable');
      if (!printableEl) throw new Error('Elemen pratinjau nota tidak ditemukan.');

      const dataUrl = await thermalPrinterService.generateThermalBitmapDataUrl(printableEl, 576);
      setThermalPreviewUrl(dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat gambar simulasi thermal.');
    }
  };

  const formattedDate = order.order_date
    ? new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : '-';
  const isWoodPacking = order.delivery_method === 'Packing Kayu' || packageInfo?.package_type === 'Packing Kayu';
  const packageTypeValue = (packageInfo?.package_type || '').trim().toLowerCase();
  const packageType = isWoodPacking
    ? 'Packing Kayu'
    : packageTypeValue === 'fullset'
      ? 'Fullset'
      : ['non-fullset', 'non fullset', 'non_fullset'].includes(packageTypeValue)
        ? 'Non Fullset'
        : packageInfo?.package_type || order.delivery_method;
  const packageItems = packageInfo?.items || order.items || [];
  const packageWeight = packageInfo?.weight !== undefined && packageInfo?.weight !== null
    ? `${packageInfo.weight} kg`
    : 'Belum tersedia';

  const modalContent = (
    <div id="packing-nota-modal-container" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 w-full h-full overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 w-[95%] max-w-sm sm:max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* Header Modal Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#04593f] text-white flex items-center justify-center font-bold shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Pratinjau Nota Packing
              </h3>
              <p className="text-[10px] text-slate-500 font-normal">
                Format thermal 80mm
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

        {/* Printable Nota Body Container */}
        <div id="packing-nota-printable" className="p-3 sm:p-4 overflow-y-auto space-y-2.5 print-area text-slate-900 font-sans text-xs flex-1">
          {/* Print specific style overrides */}
          <style>{`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }

              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 80mm !important;
                height: auto !important;
                overflow: hidden !important;
              }

              /* Hide non-printable elements completely from document flow */
              body > *:not(#packing-nota-modal-container),
              .no-print {
                display: none !important;
              }

              #packing-nota-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                height: auto !important;
                display: block !important;
                align-items: flex-start !important;
                justify-content: flex-start !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
                box-shadow: none !important;
                border: none !important;
              }

              #packing-nota-modal-container > div {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                height: auto !important;
              }

              #packing-nota-printable {
                position: relative !important;
                width: 78mm !important;
                max-width: 78mm !important;
                margin: 0 auto !important;
                padding: 1.5mm 1.5mm 3mm 1.5mm !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
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

          {/* Header Store Info */}
          <div className="border-b-2 border-black pb-2 pt-1 flex justify-between items-start gap-2">
            <div className="space-y-0.5 min-w-0 flex-1">
              <h1 className="font-bold text-xs tracking-wider text-black uppercase leading-normal pt-1">ANTAGLOMA FLORIST</h1>
              <p className="text-[9.5px] font-semibold text-black leading-tight">Spesialis Adenium Bunga Tumpuk</p>
              <p className="text-[9px] font-normal text-black leading-tight">WA: 0858-9450-3333 / 0857-3333-1889</p>
            </div>
            <div className="text-right shrink-0">
              <div className="border border-black px-2 py-1 text-[8.5px] font-bold text-black uppercase inline-block mt-0.5 mb-1 tracking-wider leading-normal text-center">
                NOTA PACKING
              </div>
              <p className="font-bold text-[11px] text-black leading-tight tracking-tight whitespace-nowrap">{order.order_number}</p>
              <p className="text-[9px] font-normal text-black leading-tight">Tgl: {formattedDate}</p>
              {packageInfo && (
                <p className="text-[9.5px] font-bold text-black leading-tight mt-0.5">Paket {packageInfo.letter}</p>
              )}
            </div>
          </div>

          {/* Receiver Info */}
          <div className="border-b border-black pb-2 space-y-1">
            <p className="text-[9px] font-bold text-black uppercase tracking-wider">PENERIMA / CUSTOMER:</p>
            <p className="font-bold text-xs text-black leading-tight break-words">{order.customer_name}</p>
            <p className="text-[10.5px] font-semibold text-black leading-tight">{order.phone}</p>
            <div className="pt-0.5 text-[9.5px] font-bold text-black">
              <span>[ {packageType.toUpperCase()} ]</span>
              <span className="ml-2 font-normal text-black">Berat: {packageWeight}</span>
            </div>
          </div>

          {/* Destination Address */}
          <div className="border-b-2 border-black pb-2 space-y-0.5">
            <p className="text-[9px] font-bold text-black uppercase tracking-wider">ALAMAT PENGIRIMAN:</p>
            <p className="font-bold text-[10px] text-black leading-snug break-words">
              {[order.district_name, order.regency_name, order.province_name].filter(Boolean).join(', ')}
            </p>
            <p className="text-[10px] font-normal text-black leading-snug break-words">{order.full_address}</p>
          </div>

          {/* Plant Items Table */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-black uppercase tracking-wider">ITEM TANAMAN & BONSAI POT</p>
            <table className="w-full text-left text-[9.5px] border-collapse table-fixed">
              <thead>
                <tr className="border-y border-black font-bold text-black uppercase tracking-wider">
                  <th className="py-1 w-5 text-center">NO</th>
                  <th className="py-1 pl-1">VARIAN ADENIUM</th>
                  <th className="py-1 text-center w-14">UKURAN</th>
                  <th className="py-1 text-center w-6">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-normal text-black">
                {packageItems.map((item, idx) => {
                  const itemName = 'order_item_id' in item ? (item.product_name || 'Tanaman') : (item.tree_name || item.product_name);
                  const gradeStr = 'grade' in item ? `Grade ${item.grade || 'A'}` : '-';
                  const notesStr = 'notes' in item && item.notes ? `(${item.notes})` : '';

                  return (
                    <tr key={idx}>
                      <td className="py-1 text-center font-bold">{idx + 1}</td>
                      <td className="py-1 pl-1 font-bold">
                        {itemName} ({gradeStr}) {notesStr}
                      </td>
                      <td className="py-1 text-center font-normal">Package</td>
                      <td className="py-1 text-center font-bold">{item.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Packing Notes Block */}
          <div className="border border-black rounded-lg p-2 space-y-1 bg-white my-1">
            <div className="flex items-center justify-between text-[8.5px] font-bold text-black uppercase tracking-wider">
              <span>CATATAN PENGIRIMAN / PACKING KAYU:</span>
              <span className="text-[7.5px] font-normal italic lowercase text-slate-700 no-print">(DAPAT DIEDIT ADMIN SEBELUM DICETAK)</span>
            </div>

            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ketik catatan packing di sini..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-800 rounded p-1.5 text-[10px] font-medium italic text-black focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-y no-print leading-relaxed"
            />
            <div className="hidden print:block text-[10px] font-medium italic text-black whitespace-pre-wrap leading-tight">
              {customNotes.trim() ? customNotes : '-'}
            </div>
          </div>

          {/* Signatures Section */}
          <div className="pt-2 border-t border-black grid grid-cols-3 gap-1.5 text-center text-[9px] font-normal pb-3">
            <div>
              <span className="text-black font-semibold block mb-4">Sales</span>
              <span className="font-bold text-black block border-t border-black pt-0.5 truncate">
                {order.creator?.name || 'Sales Staff'}
              </span>
            </div>

            <div>
              <span className="text-black font-semibold block mb-4">Admin</span>
              <span className="font-bold text-black block border-t border-black pt-0.5 truncate">
                {order.verifier?.name || 'Admin'}
              </span>
            </div>

            <div>
              <span className="text-black font-semibold block mb-4">Packing</span>
              <span className="font-bold text-black block border-t border-black pt-0.5 truncate">
                ( Staff )
              </span>
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
              title="Preview simulasi hasil cetak thermal 80mm"
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
              <span className="whitespace-nowrap">Cetak Nota</span>
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
              <div><p className="text-xs font-bold text-slate-900">Preview Thermal 80mm</p><p className="text-[10px] text-slate-500">Raster yang sama dengan output Bluetooth</p></div>
              <button type="button" onClick={() => setThermalPreviewUrl(null)} className="p-1.5 bg-slate-200 rounded-lg text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-300 p-4 overflow-auto shadow-inner">
              <div className="mx-auto bg-white shadow-md" style={{ width: '80mm', minWidth: '80mm' }}>
                <img src={thermalPreviewUrl} alt="Preview nota thermal 80mm" className="block w-full h-auto" style={{ imageRendering: 'pixelated' }} />
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">80 mm paper · 576 dots · ESC/POS raster 1-bit</p>
            <a href={thermalPreviewUrl} download={`SIMULASI_CETAK_THERMAL_80MM_${order.order_number}.png`} className="mt-3 block text-center py-2 bg-slate-800 text-white rounded-xl text-[11px] font-semibold">Download PNG</a>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
