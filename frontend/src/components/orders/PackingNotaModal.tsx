import React from 'react';
import { Order, OrderPackage } from '../../types/order';
import { Printer, X, Sprout } from 'lucide-react';

interface PackingNotaModalProps {
  order: Order | null;
  packageInfo?: OrderPackage | null;
  onClose: () => void;
}

export const PackingNotaModal: React.FC<PackingNotaModalProps> = ({ order, packageInfo, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 w-full h-full overflow-y-auto no-print">
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
              className="min-h-9 px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
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
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 print-area text-slate-900 font-sans text-xs">
          {/* Print specific style overrides */}
          <style>{`
            @media print {
              /* Hide all components from React layout */
              #root, header, main, nav, aside, footer, div[role="dialog"], .no-print {
                display: none !important;
                visibility: hidden !important;
              }
              html, body {
                width: 80mm !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
              }
              .print-area, .print-area * {
                visibility: visible !important;
                display: block !important;
              }
              .print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 4mm !important;
                box-sizing: border-box !important;
              }
              .print-area table,
              .print-area tr {
                break-inside: avoid;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          `}</style>

          {/* Header Store & Order Info Block */}
          <div className="border-b border-slate-300 pb-2 flex justify-between items-start gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-[#04593f] flex-shrink-0" />
                <span className="font-semibold text-[11px] uppercase tracking-wide text-slate-900 block leading-none">
                  ANTAGLOMA FLORIST
                </span>
              </div>
              <p className="text-[9px] font-medium text-slate-700">
                Spesialis Adenium Bunga Tumpuk
              </p>
              <p className="text-[9px] text-slate-500 leading-tight">
                Kebun 1, 2, 3 | WA: +62 858-8180-8740
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="inline-block px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-[#04593f] font-medium text-[8px] rounded uppercase tracking-wider mb-0.5">
                NOTA PACKING
              </span>
              <p className="font-medium text-[11px] text-slate-900 block">{order.order_number}</p>
              <p className="text-[10px] text-slate-400 font-medium">Tgl: {formattedDate}</p>
              {packageInfo && <p className="text-[9px] text-[#04593f] font-medium">Paket {packageInfo.letter}</p>}
            </div>
          </div>

          {/* Receiver & Address Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5 text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
                PENERIMA / CUSTOMER
              </span>
              <span className="font-medium text-slate-900 block text-[11px]">{order.customer_name}</span>
              <span className="font-medium text-slate-600 text-[11px] block">{order.phone}</span>
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#04593f] text-white font-medium text-[9px] rounded">
                Metode Kirim: {packageType}
              </span>
              {packageInfo && <span className="inline-block mt-1 ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[9px] rounded">Berat: {packageWeight}</span>}
            </div>

            <div className="pt-1.5 border-t border-slate-200/80">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
                ALAMAT PENGIRIMAN TANAMAN
              </span>
              <p className="font-medium text-slate-700 leading-snug text-[11px]">
                {[order.district_name, order.regency_name, order.province_name]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="text-[11px] text-slate-800 font-bold mt-0.5">{order.full_address}</p>
            </div>
          </div>

          {/* Table Items */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              ITEM TANAMAN & BONSAI POT
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2 text-center w-7">No</th>
                    <th className="py-1.5 px-2">Varian Adenium</th>
                    <th className="py-1.5 px-2">Ukuran</th>
                    <th className="py-1.5 px-2 text-center w-10">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-800 text-[10px]">
                {packageItems.length > 0 ? (
                  packageItems.map((item, idx) => {
                    const itemName = 'order_item_id' in item ? (item.product_name || 'Tanaman') : (item.tree_name || item.product_name);
                    return (
                    <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <span className="font-medium text-slate-900 block">{itemName}</span>
                          {'tree_code' in item && item.tree_code && (
                            <span className="text-[9px] text-slate-400 font-normal">Code: {item.tree_code}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8px] font-normal">
                            {'grade' in item ? `Grade ${item.grade || 'A'}` : 'Package'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center font-medium">{item.quantity}</td>
                      </tr>
                    );
                  })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-slate-400 font-normal">
                        Tidak ada detail item tanaman.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Callout Box */}
          {order.notes && (
            <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px]">
              <span className="font-bold text-amber-950 uppercase block text-[9px]">
                CATATAN PENGIRIMAN / PACKING KAYU:
              </span>
              <p className="text-amber-900 font-medium italic mt-0.5">"{order.notes}"</p>
            </div>
          )}

          {/* Signatures Section */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div>
              <span className="text-slate-400 font-normal block mb-6">Sales Pembuat</span>
              <span className="font-bold text-slate-800 block border-t border-dashed border-slate-300 pt-0.5">
                {order.creator?.name || 'Sales Staff'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-normal block mb-6">Verifikasi Admin</span>
              <span className="font-bold text-slate-800 block border-t border-dashed border-slate-300 pt-0.5">
                {order.verifier?.name || 'Admin'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-normal block mb-6">Staff Packing</span>
              <span className="font-bold text-slate-800 block border-t border-dashed border-slate-300 pt-0.5">
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
};
