import React, { useState } from 'react';
import { Order } from '../../types/order';
import { X, CheckCircle2, Truck, AlertCircle } from 'lucide-react';

interface CompleteShipmentModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: number, payload: { shipping_cost: number; tracking_number: string }) => Promise<void>;
}

export const CompleteShipmentModal: React.FC<CompleteShipmentModalProps> = ({ order, onClose, onConfirm }) => {
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onConfirm(order.id, {
        shipping_cost: Number(shippingCost) || 0,
        tracking_number: trackingNumber,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyelesaikan pengiriman.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-md md:max-w-xl overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Konfirmasi Pengiriman #{order.order_number}</h2>
            <p className="text-xs text-slate-600 font-medium">Customer: {order.customer_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-200 border border-slate-300 text-slate-700 hover:bg-slate-300 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm font-sans">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Nomor Resi / Tracking Number</label>
            <div className="relative">
              <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Contoh: JNT-987654321 / Kurir Internal Kebun"
                className="w-full pl-9 pr-3 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Ongkir Ekspedisi (Rp)</label>
            <input
              type="text"
              value={shippingCost === 0 ? '' : Number(shippingCost).toLocaleString('id-ID')}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/\./g, '');
                if (cleanValue === '') {
                  setShippingCost(0);
                } else if (/^\d+$/.test(cleanValue)) {
                  setShippingCost(Number(cleanValue));
                }
              }}
              placeholder="0"
              className="w-full px-3 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-extrabold"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Menyimpan...' : 'Konfirmasi & Selesaikan Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
