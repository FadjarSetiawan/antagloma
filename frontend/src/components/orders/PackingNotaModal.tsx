import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderPackage } from '../../types/order';
import { Printer, X, Sprout } from 'lucide-react';

interface PackingNotaModalProps {
  order: Order | null;
  packageInfo?: OrderPackage | null;
  onClose: () => void;
}

export const PackingNotaModal: React.FC<PackingNotaModalProps> = ({ order, packageInfo, onClose }) => {
  const [customNotes, setCustomNotes] = useState<string>(order?.notes || '');

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
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#04593f] text-white flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Pratinjau Nota Packing
              </h3>
              <p className="text-[10px] text-slate-400 font-normal">
                Format nota thermal pengemasan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="min-h-9 px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-lg text-[10.5px] font-normal flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Nota</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Nota Body Container */}
        <div id="packing-nota-printable" className="p-3 sm:p-4 overflow-y-auto space-y-2.5 print-area text-slate-900 font-sans text-xs">
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
                width: 80mm !important;
              }

              /* Position printable container */
              #packing-nota-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                display: block !important;
                visibility: visible !important;
              }

              #packing-nota-modal-container > div {
                border: none !important;
                box-shadow: none !important;
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }

              #packing-nota-printable {
                display: block !important;
                visibility: visible !important;
                width: 80mm !important;
                padding: 4mm !important;
                box-sizing: border-box !important;
              }

              #packing-nota-printable * {
                visibility: visible !important;
              }

              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          `}</style>

          {/* Header Store & Order Info Block */}
          <div className="border-b border-black pb-2 flex justify-between items-start gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <Sprout className="w-4 h-4 text-black flex-shrink-0" />
                <span className="font-bold text-[12px] uppercase tracking-wide text-black block leading-none">
                  ANTAGLOMA FLORIST
                </span>
              </div>
              <p className="text-[9.5px] font-semibold text-black">
                Spesialis Adenium Bunga Tumpuk
              </p>
              <p className="text-[9px] text-black leading-tight">
                WA: 0858-9450-3333 / 0857-3333-1889
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="inline-block px-1.5 py-0.5 border border-black text-black font-bold text-[8.5px] uppercase tracking-wider mb-0.5">
                NOTA PACKING
              </span>
              <p className="font-bold text-[11px] text-black block">{order.order_number}</p>
              <p className="text-[9.5px] text-black font-medium">Tgl: {formattedDate}</p>
              {packageInfo && <p className="text-[9.5px] text-black font-bold">Paket {packageInfo.letter}</p>}
            </div>
          </div>

          {/* Receiver & Address Section (Monochrome clean layout) */}
          <div className="border-b border-black pb-2 space-y-1.5 text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase text-black block mb-0.5 tracking-wider">
                PENERIMA / CUSTOMER:
              </span>
              <span className="font-bold text-black block text-[11.5px]">{order.customer_name}</span>
              <span className="font-semibold text-black text-[11px] block">{order.phone}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-[9.5px] text-black uppercase">
                  [ {packageType} ]
                </span>
                {packageInfo && <span className="font-semibold text-[9.5px] text-black">Berat: {packageWeight}</span>}
              </div>
            </div>

            <div className="pt-1.5 border-t border-dashed border-slate-300">
              <span className="text-[9px] font-bold uppercase text-black block mb-0.5 tracking-wider">
                ALAMAT PENGIRIMAN:
              </span>
              <p className="font-semibold text-black leading-snug text-[11px]">
                {[order.district_name, order.regency_name, order.province_name]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="text-[11px] text-black font-bold mt-0.5 leading-normal">{order.full_address}</p>
            </div>
          </div>

          {/* Table Items (Monochrome minimal border) */}
          <div className="space-y-1">
            <span className="text-[9.5px] font-bold uppercase text-black block tracking-wider">
              ITEM TANAMAN & BONSAI POT
            </span>
            <div className="border-t border-b border-black">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black text-black font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-1 px-1 text-center w-6">No</th>
                    <th className="py-1 px-1">Varian Adenium</th>
                    <th className="py-1 px-1">Ukuran</th>
                    <th className="py-1 px-1 text-center w-8">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal text-black text-[10px]">
                {packageItems.length > 0 ? (
                  packageItems.map((item, idx) => {
                    const itemName = 'order_item_id' in item ? (item.product_name || 'Tanaman') : (item.tree_name || item.product_name);
                    return (
                      <tr key={idx}>
                        <td className="py-1 px-1 text-center font-semibold">{idx + 1}</td>
                        <td className="py-1 px-1">
                          <span className="font-bold text-black block leading-tight">{itemName}</span>
                          {'tree_code' in item && item.tree_code && (
                            <span className="text-[9px] text-black font-normal">Code: {item.tree_code}</span>
                          )}
                        </td>
                        <td className="py-1 px-1">
                          <span className="text-[9px] font-semibold text-black">
                            {'grade' in item ? `Grade ${item.grade || 'A'}` : 'Package'}
                          </span>
                        </td>
                        <td className="py-1 px-1 text-center font-bold text-black">{item.quantity}</td>
                      </tr>
                    );
                  })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-2 text-center text-black italic">
                        Tidak ada detail item tanaman.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Callout Box (Monochrome simple border with editable feature for admin) */}
          <div className="p-1.5 border border-black rounded text-[10.5px]">
            <div className="flex items-center justify-between no-print mb-1">
              <span className="font-bold text-black uppercase block text-[9px]">
                CATATAN PENGIRIMAN / PACKING KAYU:
              </span>
              <span className="text-[8.5px] text-slate-400 font-normal italic">
                (Dapat diedit admin sebelum dicetak)
              </span>
            </div>
            <span className="font-bold text-black uppercase hidden print:block text-[9px]">
              CATATAN PENGIRIMAN / PACKING KAYU:
            </span>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ketik catatan pengiriman / packing kayu di sini..."
              rows={2}
              className="w-full text-black font-semibold italic mt-0.5 bg-transparent border-none p-0 focus:ring-0 focus:outline-none resize-none no-print"
            />
            <p className="text-black font-semibold italic mt-0.5 hidden print:block whitespace-pre-wrap">
              {customNotes.trim() ? `"${customNotes}"` : '-'}
            </p>
          </div>

          {/* Signatures Section */}
          <div className="pt-2 border-t border-black grid grid-cols-3 gap-2 text-center text-[9.5px]">
            <div>
              <span className="text-black font-medium block mb-5">Sales Pembuat</span>
              <span className="font-bold text-black block border-t border-black pt-0.5">
                {order.creator?.name || 'Sales Staff'}
              </span>
            </div>

            <div>
              <span className="text-black font-medium block mb-5">Verifikasi Admin</span>
              <span className="font-bold text-black block border-t border-black pt-0.5">
                {order.verifier?.name || 'Admin'}
              </span>
            </div>

            <div>
              <span className="text-black font-medium block mb-5">Staff Packing</span>
              <span className="font-bold text-black block border-t border-black pt-0.5">
                ( Packing )
              </span>
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

