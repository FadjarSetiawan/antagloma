import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderPackage } from '../../types/order';
import { Printer, X, Sprout, Bluetooth, AlertCircle, Download } from 'lucide-react';
import { thermalPrinterService } from '../../utils/thermalPrinter';

interface PackingNotaModalProps {
  order: Order | null;
  packageInfo?: OrderPackage | null;
  onClose: () => void;
}

export const PackingNotaModal: React.FC<PackingNotaModalProps> = ({ order, packageInfo, onClose }) => {
  const [customNotes, setCustomNotes] = useState<string>(order?.notes || '');
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setCustomNotes(order.notes || '');
    }
  }, [order]);

  if (!order) return null;

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

  const handleDirectBluetoothPrint = async () => {
    setIsBluetoothPrinting(true);
    setBtError(null);

    try {
      await thermalPrinterService.ensureConnected();

      const printableEl = document.getElementById('packing-nota-printable');
      if (!printableEl) throw new Error('Elemen pratinjau nota tidak ditemukan.');

      await thermalPrinterService.printElementAsBitmap(printableEl, 576);
    } catch (err: any) {
      setBtError(err.message || 'Gagal cetak via Bluetooth.');
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handleDownloadThermalBitmap = async () => {
    try {
      const printableEl = document.getElementById('packing-nota-printable');
      if (!printableEl) throw new Error('Elemen pratinjau nota tidak ditemukan.');

      const dataUrl = await thermalPrinterService.generateThermalBitmapDataUrl(printableEl, 576);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `SIMULASI_CETAK_THERMAL_80MM_${order.order_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat gambar simulasi thermal.');
    }
  };

  const formattedDate = order.order_date
    ? new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : '-';
  const packageTypeValue = (packageInfo?.package_type || '').trim().toLowerCase();
  const packageType = packageTypeValue === 'fullset'
    ? 'Fullset'
    : ['non-fullset', 'non fullset', 'non_fullset'].includes(packageTypeValue)
      ? 'Non Fullset'
      : packageTypeValue === 'packing kayu'
        ? 'Packing Kayu'
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

        {btError && (
          <div className="p-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-[10.5px] font-medium flex items-center justify-between no-print">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{btError}</span>
            </div>
            <button onClick={() => setBtError(null)} className="text-rose-600 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Printable Nota Body Container */}
        <div id="packing-nota-printable" className="p-3 sm:p-4 overflow-y-auto space-y-2.5 print-area text-slate-900 font-sans text-xs flex-1">
          {/* Print specific style overrides */}
          <style>{`
            @media print {
              /* Hide main layout elements */
              #no-print-wrapper,
              .no-print {
                display: none !important;
              }

              /* Reset root document bounds for 80mm thermal paper */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 80mm !important;
                max-width: 80mm !important;
                height: auto !important;
                overflow: hidden !important;
              }

              /* Position printable container */
              #packing-nota-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
              }

              #packing-nota-printable {
                width: 80mm !important;
                max-width: 80mm !important;
                padding: 3mm !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }

              /* Disable page breaks */
              * {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
              }
            }
          `}</style>

          {/* Header Store Info */}
          <div className="border-b-2 border-black pb-2 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-black" />
                <h1 className="font-extrabold text-xs tracking-wide text-black uppercase">ANTAGLOMA FLORIST</h1>
              </div>
              <p className="text-[9.5px] font-bold text-black mt-0.5">Spesialis Adenium Bunga Tumpuk</p>
              <p className="text-[9px] text-black">WA: 0858-9450-3333 / 0857-3333-1889</p>
            </div>
            <div className="text-right">
              <div className="border border-black px-1.5 py-0.5 text-[9px] font-extrabold text-black uppercase inline-block mb-1">
                NOTA PACKING
              </div>
              <p className="font-extrabold text-[10.5px] text-black leading-tight">{order.order_number}</p>
              <p className="text-[9px] font-bold text-black">Tgl: {formattedDate}</p>
              {packageInfo && (
                <p className="text-[10px] font-black text-black mt-0.5">Paket {packageInfo.letter}</p>
              )}
            </div>
          </div>

          {/* Receiver Info */}
          <div className="border-b border-black pb-2 space-y-1">
            <p className="text-[9px] font-bold text-black uppercase">PENERIMA / CUSTOMER:</p>
            <p className="font-extrabold text-xs text-black leading-tight">{order.customer_name}</p>
            <p className="text-[10.5px] font-bold text-black">{order.phone}</p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-extrabold text-[10px] text-black uppercase">[ {packageType} ]</span>
              <span className="text-[9.5px] font-semibold text-black">Berat: {packageWeight}</span>
            </div>
          </div>

          {/* Destination Address */}
          <div className="border-b-2 border-black pb-2 space-y-0.5">
            <p className="text-[9px] font-bold text-black uppercase">ALAMAT PENGIRIMAN:</p>
            <p className="font-extrabold text-[10.5px] text-black leading-snug">
              {[order.district_name, order.regency_name, order.province_name].filter(Boolean).join(', ')}
            </p>
            <p className="text-[10px] font-bold text-black leading-tight">{order.full_address}</p>
          </div>

          {/* Plant Items Table */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-black uppercase">ITEM TANAMAN & BONSAI POT</p>
            <table className="w-full text-left text-[9.5px] border-collapse">
              <thead>
                <tr className="border-y-2 border-black font-extrabold text-black">
                  <th className="py-1 w-6">NO</th>
                  <th className="py-1">VARIAN ADENIUM</th>
                  <th className="py-1 text-center w-14">UKURAN</th>
                  <th className="py-1 text-center w-8">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-bold text-black">
                {packageItems.map((item, idx) => {
                  const itemName = 'order_item_id' in item ? (item.product_name || 'Tanaman') : (item.tree_name || item.product_name);
                  const gradeStr = 'grade' in item ? `Grade ${item.grade || 'A'}` : '-';

                  return (
                    <tr key={idx}>
                      <td className="py-1.5 align-top">{idx + 1}</td>
                      <td className="py-1.5 align-top">
                        <span className="uppercase block font-extrabold">{itemName} ({gradeStr})</span>
                      </td>
                      <td className="py-1.5 align-top text-center">Package</td>
                      <td className="py-1.5 align-top text-center font-extrabold">{item.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Packing Notes Box (Editable text box for admin) */}
          <div className="border border-black p-2 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[9px] font-extrabold text-black uppercase">
              <span>CATATAN PENGIRIMAN / PACKING KAYU:</span>
              <span className="text-[8px] text-slate-500 font-normal italic no-print">(Dapat diedit admin sebelum dicetak)</span>
            </div>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ketik catatan packing di sini..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-800 rounded p-1.5 text-[10.5px] font-bold italic text-black focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-y no-print leading-relaxed"
            />
            <div className="hidden print:block text-[10px] font-bold italic text-black whitespace-pre-wrap">
              {customNotes.trim() ? customNotes : '-'}
            </div>
          </div>

          {/* Signatures Section */}
          <div className="pt-2 border-t border-black grid grid-cols-3 gap-2 text-center text-[9.5px]">
            <div>
              <span className="text-black font-medium block mb-5">Sales</span>
              <span className="font-bold text-black block border-t border-black pt-0.5">
                {order.creator?.name || 'Sales Staff'}
              </span>
            </div>

            <div>
              <span className="text-black font-medium block mb-5">Admin</span>
              <span className="font-bold text-black block border-t border-black pt-0.5">
                {order.verifier?.name || 'Admin'}
              </span>
            </div>

            <div>
              <span className="text-black font-medium block mb-5">Packing</span>
              <span className="font-bold text-black block border-t border-black pt-0.5">
                ( Staff )
              </span>
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

