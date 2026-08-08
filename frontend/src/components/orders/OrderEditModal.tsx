import React, { useState, useEffect } from 'react';
import { Order } from '../../types/order';
import { UpdateOrderPayload } from '../../services/orderService';
import { X, Edit3, Save } from 'lucide-react';

interface OrderEditModalProps {
  order: Order | null;
  onClose: () => void;
  onSubmit: (id: number, payload: UpdateOrderPayload) => Promise<void>;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, onClose, onSubmit }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Kirim Paket');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer_name);
      setPhone(order.phone);
      setDeliveryMethod(order.delivery_method);
      setFullAddress(order.full_address);
      setNotes(order.notes || '');
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(order.id, {
        customer_name: customerName,
        phone,
        delivery_method: deliveryMethod,
        full_address: fullAddress,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-lg md:max-w-2xl lg:max-w-3xl overflow-hidden my-auto flex flex-col">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Edit Pesanan #{order.order_number}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Perbarui data pemesan & pengiriman</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Nama Customer *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">No WhatsApp / Telepon *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Metode Pengiriman *</label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            >
              <option value="Kirim Paket">Kirim Paket</option>
              <option value="Packing Kayu">Packing Kayu</option>
              <option value="Ambil Di Lokasi">Ambil Di Lokasi</option>
              <option value="Antar Ke Rumah">Antar Ke Rumah</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Alamat Lengkap *</label>
            <textarea
              required
              rows={3}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Catatan Pengiriman (Opsional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Contoh: Id jws dikirim fullset\nId swl dikirim non fullset`}
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
