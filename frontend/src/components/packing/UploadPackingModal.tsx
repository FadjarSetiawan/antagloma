import React, { useState } from 'react';
import { Order } from '../../types/order';
import { X, UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface UploadPackingModalProps {
  order: Order | null;
  onClose: () => void;
  onUpload: (orderId: number, file: File, notes: string) => Promise<void>;
}

export const UploadPackingModal: React.FC<UploadPackingModalProps> = ({ order, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Harap pilih foto bukti packing terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onUpload(order.id, file, notes);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengunggah foto packing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-95 p-4">
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-slate-200 flex items-center justify-between bg-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Upload Bukti Packing #{order.order_number}</h2>
            <p className="text-xs text-slate-600 font-medium">Customer: {order.customer_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Foto Tanaman Terkemas (Packing) *</label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-700 transition-colors bg-slate-50 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {preview ? (
                <div className="space-y-2">
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-cover border border-slate-300 shadow-sm" />
                  <p className="text-xs text-emerald-800 font-bold">Klik untuk mengganti foto</p>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Klik atau seret foto ke sini untuk memilih file</p>
                  <p className="text-[10px] text-slate-500 font-medium">Format: JPG, PNG (Max. 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Catatan Khusus Staff Packing (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Sudah dipacking kayu tebal 2 lapis, pot diikat kencang..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
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
              disabled={isLoading || !file}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-md hover:shadow-lg hover:scale-[1.01] disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              {isLoading ? 'Mengunggah...' : 'Unggah Foto Packing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
