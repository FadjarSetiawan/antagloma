import React from 'react';
import { Order } from '../../types/order';
import { Printer, X, Sprout } from 'lucide-react';

interface PackingNotaModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PackingNotaModal: React.FC<PackingNotaModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.order_date
    ? new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : '-';

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
              className="px-3 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 print-area text-slate-900 font-sans text-xs">
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
                padding: 5mm !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: portrait;
                margin: 5mm;
              }
            }
          `}</style>

          {/* Header Store & Order Info Block */}
          <div className="border-b border-slate-300 pb-2.5 flex justify-between items-start gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-[#04593f] flex-shrink-0" />
                <span className="font-extrabold text-xs uppercase tracking-wide text-slate-900 block leading-none">
                  ANTAGLOMA FLORIST
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-700">
                Spesialis Adenium Bunga Tumpuk
              </p>
              <p className="text-[9px] text-slate-500 leading-tight">
                Kebun 1, 2, 3 | WA: +62 858-8180-8740
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[#04593f] font-bold text-[9px] rounded uppercase tracking-wider mb-0.5">
                NOTA PACKING
              </span>
              <p className="font-bold text-xs text-slate-900 block">{order.order_number}</p>
              <p className="text-[10px] text-slate-400 font-medium">Tgl: {formattedDate}</p>
            </div>
          </div>

          {/* Receiver & Address Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
                PENERIMA / CUSTOMER
              </span>
              <span className="font-bold text-slate-900 block text-xs">{order.customer_name}</span>
              <span className="font-medium text-slate-600 text-[11px] block">{order.phone}</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-[#04593f] text-white font-bold text-[10px] rounded">
                Metode: {order.delivery_method}
              </span>
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
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2 text-center w-7">No</th>
                    <th className="py-1.5 px-2">Varian Adenium</th>
                    <th className="py-1.5 px-2">Ukuran</th>
                    <th className="py-1.5 px-2 text-center w-10">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800 text-[11px]">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <span className="font-bold text-slate-900 block">{item.tree_name || item.product_name}</span>
                          {item.tree_code && (
                            <span className="text-[9px] text-slate-400 font-normal">Code: {item.tree_code}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold">
                            Grade {item.grade || 'A'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold">{item.quantity}</td>
                      </tr>
                    ))
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
