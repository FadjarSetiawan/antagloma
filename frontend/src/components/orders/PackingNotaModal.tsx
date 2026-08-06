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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto no-print">
      <div className="bg-white rounded-3xl border-2 border-slate-200 w-[95%] max-w-xl md:max-w-3xl lg:max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                PRATINJAU NOTA PACKING TANAMAN
              </h3>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Nota pengemasan & pemeriksaan fisik kebun
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Nota</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Nota Body Container */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-5 print-area text-slate-900 font-sans text-xs sm:text-sm">
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
                padding: 10mm !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: portrait;
                margin: 10mm;
              }
            }
          `}</style>

          {/* Header Store & Order Info Block */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sprout className="w-6 h-6 text-emerald-800 flex-shrink-0" />
                <span className="font-black text-base sm:text-lg uppercase tracking-wider text-emerald-900 block leading-none">
                  ANTAGLOMA FLORIST
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-800">
                Spesialis Tanaman Hias Adenium Bunga Tumpuk
              </p>
              <p className="text-[11px] text-slate-600 font-medium leading-tight">
                Kebun 1: Jl. Ternate No. 23 | Kebun 2: Jl. Sulawesi No. 19 | Kebun 3: Jl. Natuna
                <br />
                WA Order: +62 858-8180-8740
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-xs rounded-lg uppercase tracking-wider mb-1">
                NOTA PACKING
              </span>
              <p className="font-black text-sm text-slate-900 block">{order.order_number}</p>
              <p className="text-xs text-slate-600 font-bold">Tgl: {formattedDate}</p>
            </div>
          </div>

          {/* Receiver & Address Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs sm:text-sm">
            <div>
              <span className="text-xs font-extrabold uppercase text-slate-500 block mb-1">
                PENERIMA / CUSTOMER
              </span>
              <span className="font-black text-slate-900 block text-sm">{order.customer_name}</span>
              <span className="font-bold text-slate-700 block">{order.phone}</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-800 text-white font-extrabold text-xs rounded-md">
                Metode: {order.delivery_method}
              </span>
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase text-slate-500 block mb-1">
                ALAMAT PENGIRIMAN TANAMAN
              </span>
              <p className="font-semibold text-slate-800 leading-snug">
                {[order.district_name, order.regency_name, order.province_name]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="text-xs text-slate-700 font-bold mt-1">{order.full_address}</p>
            </div>
          </div>

          {/* Table Items */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase text-slate-700 block">
              ITEM TANAMAN & BONSAI POT
            </span>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold text-xs">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Jenis Varian Tanaman Adenium</th>
                    <th className="py-2.5 px-3">Ukuran / Bonggol</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-black text-slate-900 block text-xs sm:text-sm">{item.tree_name || item.product_name}</span>
                          {item.tree_code && (
                            <span className="text-xs text-slate-500 font-bold">Code: {item.tree_code}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-extrabold">
                            Grade {item.grade || 'A'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-sm">{item.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500 font-medium">
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
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs">
              <span className="font-extrabold text-amber-950 uppercase block">
                CATATAN KHUSUS KARAKTER TANAMAN / PACKING KAYU:
              </span>
              <p className="text-amber-900 font-bold italic mt-0.5">"{order.notes}"</p>
            </div>
          )}

          {/* Signatures Section */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <span className="text-slate-500 font-bold block mb-10">Sales Pembuat</span>
              <span className="font-black text-slate-900 block border-t border-dashed border-slate-400 pt-1 mx-2">
                {order.creator?.name || 'Sales Staff'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-bold block mb-10">Verifikasi Admin</span>
              <span className="font-black text-slate-900 block border-t border-dashed border-slate-400 pt-1 mx-2">
                {order.verifier?.name || 'Owner / Admin'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-bold block mb-10">Petugas Packing Kebun</span>
              <span className="font-black text-slate-900 block border-t border-dashed border-slate-400 pt-1 mx-2">
                ( Staff Packing )
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-extrabold transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
