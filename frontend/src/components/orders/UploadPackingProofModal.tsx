import React, { useState } from 'react';
import { Order } from '../../types/order';
import { X, Upload, ImageIcon, AlertCircle } from 'lucide-react';

interface UploadPackingProofModalProps {
  order: Order | null;
  onClose: () => void;
  onUpload: (orderId: number, file: File, notes?: string) => Promise<any>;
}

export const UploadPackingProofModal: React.FC<UploadPackingProofModalProps> = ({
  order,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file foto maksimal 5 MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Harap pilih foto bukti packing tanaman.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onUpload(order.id, selectedFile, notes);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengunggah foto packing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 w-[95%] max-w-md md:max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              Upload Bukti Packing #{order.order_number}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Customer: {order.customer_name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm font-sans">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              Foto Tanaman Terkemas (Packing) *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center hover:border-emerald-700 transition-colors bg-slate-50 relative">
              <input
                type="file"
                required
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Preview Packing"
                    className="max-h-48 mx-auto rounded-xl object-cover border border-slate-300 shadow-xs"
                  />
                  <p className="text-xs text-emerald-800 font-bold">
                    ✅ Foto terpilih. Klik untuk mengganti foto.
                  </p>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik atau seret foto ke sini untuk memilih file
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Format: JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              Catatan Khusus Staff Packing (Opsional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Sudah dipacking kayu tebal 2 lapis, pot dilapisi bublewrap..."
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                selectedFile && !isLoading
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-900/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{isLoading ? 'Mengunggah...' : 'Unggah Foto Packing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
